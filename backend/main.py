from flask import Flask, request, jsonify
from models.token_blacklist import TokenBlacklist
from models.user import User
from datetime import datetime
from sqlalchemy import func
from dotenv import load_dotenv
from models import db
from extensions import limiter, bcrypt, jwt, cors, talisman, discord, oauth
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.contact_routes import contact_bp
from routes.payment_routes import payment_bp
from routes.oauth_routes import oauth_bp
from routes.books_routes import books_bp
import json
import pytz
import stripe
import re
import os

basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '.env')
load_dotenv(env_path)

app = Flask(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['TESTING'] = False
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'users.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config["DISCORD_CLIENT_ID"] =  os.getenv('DISCORD_CLIENT_ID')
app.config["DISCORD_CLIENT_SECRET"] = os.getenv('DISCORD_CLIENT_SECRET')
app.config["DISCORD_REDIRECT_URI"] = os.getenv('DISCORD_CALLBACK_URL')
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
app.secret_key = os.getenv('FLASK_SECRET_KEY')
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "true"

db.init_app(app)
limiter.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
cors.init_app(app)
if app.config.get("TESTING", False):
    talisman.init_app(app)
discord.init_app(app)
oauth.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(books_bp)
app.register_blueprint(user_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(oauth_bp)

def clean_expired_tokens():
    now = datetime.now(pytz.timezone('Europe/Warsaw'))
    expired = TokenBlacklist.query.filter(TokenBlacklist.expires_at < now).all()
    for jti in expired:
        db.session.delete(jti)
    db.session.commit()
    print(f"Usunięto {len(expired)} wygasłych tokenów z blacklisty.")

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = TokenBlacklist.query.filter_by(jti=jti).first()
    return token is not None

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Access token unieważniony."}), 401

@app.before_request
def method_override_disabler():
    if 'X-HTTP-Method-Override' in request.headers:
        return jsonify({"message": "Nagłówek X-HTTP-Method-Override jest niedozwolony."}), 403

@app.before_request
def block_file_uploads():
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        return jsonify({"error": "Przesyłanie plików jest zablokowane."}), 400

def get_last_log_number():
    try:
        with open("app.log", "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.findall(r'^(\d+)\.', content, re.MULTILINE)
            if matches:
                return max(map(int, matches)) + 1
    except FileNotFoundError:
        pass
    return 1

request_counter = get_last_log_number()

@app.before_request
def log_request():
    global request_counter
    
    if request.path.startswith('/static') or request.path == '/favicon.ico':
        return
    
    timestamp = datetime.now(pytz.timezone('Europe/Warsaw')).strftime('%d-%m-%Y %H:%M:%S')
    
    log_entry = f"{request_counter}. {timestamp} - {request.method} {request.path}\n"
    log_entry += f"IP: {request.remote_addr}\n"
    log_entry += f"User-Agent: {request.headers.get('User-Agent', 'Unknown')}\n"
    
    if request.content_type and 'application/json' in request.content_type:
        try:
            body = request.get_json(silent=True)
            if body:
                sanitized_body = body.copy() if isinstance(body, dict) else body
                if isinstance(sanitized_body, dict):
                    for key in sanitized_body:
                        if 'password' in key.lower() or 'token' in key.lower() or 'access_token' in key.lower() or 'refresh_token' in key.lower():
                            sanitized_body[key] = '[HIDDEN]'
                log_entry += f"Body: {json.dumps(sanitized_body, indent=2, ensure_ascii=False)}\n"
        except Exception as e:
            log_entry += f"Błąd body: {str(e)}\n"
    
    if request.args:
        log_entry += f"Query params: {dict(request.args)}\n"
    
    log_entry += "\n"
    
    with open("app.log", "a", encoding="utf-8") as f:
        f.write(log_entry)
    
    request_counter += 1

def create_admin_account():
    admin_username = os.getenv('ADMIN_USERNAME')
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_password = os.getenv('ADMIN_PASSWORD')

    if not admin_username or not admin_email or not admin_password:
        print("Brak danych administratora w zmiennych środowiskowych.")
        return

    existing_admin = User.query.filter(
        (func.lower(User.username) == admin_username.lower()) |
        (func.lower(User.email) == admin_email.lower())
    ).first()

    if existing_admin:
        print("Konto administratora już istnieje.")
        return

    hashed_password = bcrypt.generate_password_hash(admin_password).decode('utf-8')
    admin_user = User(username=admin_username, email=admin_email, password=hashed_password)

    try:
        db.session.add(admin_user)
        db.session.commit()
        print(f"Konto administratora '{admin_username}' zostało utworzone.")
    except Exception as e:
        db.session.rollback()
        print(f"Błąd podczas tworzenia konta administratora: {str(e)}")

def create_accounts():
    usernames = ["Lukasz", "Kacper", "Michal", "Emillos"]
    emails = ["Lukasz@o2.pl", "Kacper@o2.pl", "Michal@o2.pl", "Emillos@o2.pl"]
    passwords = ["Lukasz1.", "Kacper1.", "Michal1.", "Emillos1."]

    for i in range(len(usernames)):
        username = usernames[i]
        email = emails[i]
        password = passwords[i]

        if not username or not email or not password:
            print(f"Brak wszystkich danych dla użytkownika {i+1}.")
            continue

        existing_user = User.query.filter(
            (func.lower(User.username) == username.lower()) |
            (func.lower(User.email) == email.lower())
        ).first()

        if existing_user:
            print(f"Użytkownik '{username}' lub email '{email}' już istnieje.")
            continue

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)

        try:
            db.session.add(new_user)
            db.session.commit()
            print(f"Konto użytkownika '{username}' zostało utworzone.")
        except Exception as e:
            db.session.rollback()
            print(f"Błąd podczas tworzenia konta '{username}': {str(e)}")

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"message": "Endpoint nie istnieje."}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin_account()
        create_accounts()
        clean_expired_tokens()
    app.run(host='0.0.0.0', port=5000, debug=True)