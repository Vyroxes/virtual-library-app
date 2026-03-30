from flask import Blueprint, make_response, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, jwt_required, get_jwt_identity
from flask_jwt_extended.utils import decode_token
from flask_wtf.csrf import validate_csrf, generate_csrf
from extensions import bcrypt
from sqlalchemy import func
from controllers.auth_controller import authenticate_user
from models import TokenBlacklist, db, User
from datetime import datetime, timedelta
from models import User
from routes.activity_tracker import active_users, set_user_active
from extensions import limiter
import re

auth_bp = Blueprint('auth_bp', __name__)

ACCESS_TOKEN_EXPIRES = timedelta(minutes=10)
REFRESH_TOKEN_EXPIRES = timedelta(hours=1)
REFRESH_TOKEN_EXPIRES_REMEMBER = timedelta(days=1)

@auth_bp.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "Użytkownik nie istnieje"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "discord_id": user.discord_id,
        "github_id": user.github_id
    }), 200

@auth_bp.route('/api/refresh', methods=['POST'])
@limiter.limit("10 per minute")
def refresh():
    csrf_token = request.headers.get("X-CSRFToken")

    if not csrf_token:
        return jsonify({"message": "Brak CSRF tokena"}), 403

    try:
        validate_csrf(csrf_token)
    except Exception:
        return jsonify({"message": "Błąd CSRF"}), 403

    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return jsonify({"message": "Brak refresh tokenu."}), 400

    try:
        decoded_token = decode_token(refresh_token)
        user_id = decoded_token['sub']

        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({"message": "Użytkownik nie istnieje."}), 404

        access_expires_delta = ACCESS_TOKEN_EXPIRES
        refresh_expires_delta = REFRESH_TOKEN_EXPIRES

        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=access_expires_delta
        )
        refresh_token_new = create_refresh_token(
            identity=str(user.id),
            expires_delta=refresh_expires_delta
        )

        response = jsonify({
            "message": "Token odświeżony.",
            "username": user.username,
            "access_token": access_token
        })

        response.set_cookie(
            "refresh_token",
            refresh_token_new,
            httponly=True,
            secure=False,   # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            httponly=False,
            secure=False,  # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        return response, 200

    except Exception as e:
        return jsonify({"message": "Błąd podczas odświeżania tokenów: " + str(e)}), 500

@auth_bp.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    csrf_token = request.headers.get("X-CSRFToken")

    if not csrf_token:
        return jsonify({"message": "Brak CSRF tokena"}), 403

    try:
        validate_csrf(csrf_token)
    except Exception:
        return jsonify({"message": "Błąd CSRF"}), 403

    try:
        user_id = get_jwt_identity()
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({"message": "Użytkownik nie istnieje."}), 404

        current_token = get_jwt()
        jti = current_token['jti']

        access_expiration = datetime.fromtimestamp(current_token['exp'])
        access_blacklist = TokenBlacklist(
            username=user.username,
            email=user.email,
            jti=jti,
            expires_at=access_expiration
        )

        db.session.add(access_blacklist)
        db.session.commit()

        response = make_response(jsonify({"message": "Wylogowano pomyślnie."}))
        response.delete_cookie(
            "refresh_token",
            path="/"
        )
        response.delete_cookie(
            "csrf_token",
            path="/"
        )
        response.delete_cookie(
            "session",
            path="/"
        )

        active_users.pop(user.id, None)

        return response, 200
    
    except Exception as e:
        return jsonify({"message": "Błąd podczas wylogowania: " + str(e)}), 500

@auth_bp.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    
    try:
        if not data:
            return jsonify({"message": "Brak danych."}), 400

        username_or_email = data.get('usernameOrEmail')
        password = data.get('password')

        if not username_or_email or not password:
            return jsonify({"message": "Brak wymaganych pól: usernameOrEmail, password."}), 400
        if username_or_email.strip() == '' or password.strip() == '':
            return jsonify({"message": "Pola nie mogą być puste."}), 400
        if len(username_or_email) < 6 or len(username_or_email) > 320:
            return jsonify({"message": "Nieprawidłowa długość username/email."}), 400
        if len(password) < 8 or len(password) > 20:
            return jsonify({"message": "Nieprawidłowa długość hasła."}), 400
    except (ValueError, TypeError):
        return jsonify({"message": "Nieprawidłowy format danych."}), 400

    user = authenticate_user(username_or_email, password)

    if not user:
        return jsonify({"message": "Niepoprawne dane."}), 401

    try:
        access_expires_delta = ACCESS_TOKEN_EXPIRES

        if data.get('remember'):
            refresh_expires_delta = REFRESH_TOKEN_EXPIRES_REMEMBER
        else:
            refresh_expires_delta = REFRESH_TOKEN_EXPIRES

        set_user_active(user.id)

        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=access_expires_delta
        )

        refresh_token = create_refresh_token(
            identity=str(user.id),
            expires_delta=refresh_expires_delta
        )

        response = make_response(jsonify({
            "message": "Logowanie pomyślne.",
            "username": user.username,
            "email": user.email,
            "access_token": access_token
        }))

        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=False,  # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            httponly=False,
            secure=False,  # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        return response, 200

    except Exception as e:
        return jsonify({"message": "Błąd podczas logowania: " + str(e)}), 500

@auth_bp.route('/api/register', methods=['POST'])
@limiter.limit("3 per minute")
def register():
    data = request.get_json()

    try:
        polish_chars = r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]"

        if not data.get('username') or not data.get('email') or not data.get('password') or not data.get('password2'):
            return jsonify({"message": "Brak wymaganych pól: username, email, password, password2."}), 400
        if data.get('username') == '' or data.get('email') == '' or data.get('password') == '' or data.get('password2') == '':
            return jsonify({"message": "Pola username, email, password i password2 nie mogą być puste."}), 400
        if len(data.get('username')) < 5 or len(data.get('username')) > 20 or len(data.get('email')) < 6 or len(data.get('email')) > 320 or len(data.get('password')) > 20 or len(data.get('password')) < 8:
            return jsonify({"message": "Pola username, email i password nie mogą mieć mniej niż 5, 6 i 8 oraz więcej niż 20, 320 i 20 znaków."}), 400
        if " " in data.get('username') or " " in data.get('email') or " " in data.get('password') or " " in data.get('password2'):
            return jsonify({"message": "Pola username, email, password i password2 nie mogą zawierać spacji."}), 400
        if re.search(polish_chars, data.get('username')):
            return jsonify({"message": "Nazwa użytkownika nie może zawierać polskich znaków."}), 400
        if re.search(polish_chars, data.get('email')):
            return jsonify({"message": "Email nie może zawierać polskich znaków."}), 400
        if re.search(polish_chars, data.get('password')):
            return jsonify({"message": "Hasło nie może zawierać polskich znaków."}), 400
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data.get('email')):
            return jsonify({"message": "Nieprawidłowy format adresu email."}), 400
        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>[\]])[A-Za-z\d!@#$%^&*(),.?\":{}|<>[\]]{8,20}$", data.get('password')):
            return jsonify({"message": "Hasło musi mieć co najmniej jedną małą literę, jedną wielką literę, jedną cyfrę i jeden znak specjalny."}), 400
        if data.get('password') != data.get('password2'):
            return jsonify({"message": "Hasła nie są zgodne."}), 400
    except (ValueError, TypeError):
        return jsonify({"message": "Nieprawidłowy format danych."}), 400

    if User.query.filter(func.lower(User.username) == data.get('username').lower()).first():
        return jsonify({"message": "Nazwa użytkownika jest już zajęta."}), 400
    
    if User.query.filter(func.lower(User.email) == data.get('email').lower()).first():
        return jsonify({"message": "Email jest już zajęty."}), 400

    try:
        hashed_password = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')

        new_user = User(
            username=data.get('username'),
            email=data.get('email'),
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        set_user_active(new_user.id)

        access_expires_delta = ACCESS_TOKEN_EXPIRES
        refresh_expires_delta = REFRESH_TOKEN_EXPIRES

        access_token = create_access_token(
            identity=str(new_user.id),
            expires_delta=access_expires_delta
        )

        refresh_token = create_refresh_token(
            identity=str(new_user.id),
            expires_delta=refresh_expires_delta
        )

        response = make_response(jsonify({
            "message": "Rejestracja pomyślna",
            "username": new_user.username,
            "email": new_user.email,
            "access_token": access_token
        }))

        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=False,   # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            httponly=False,
            secure=False,  # localhost, inaczej True
            samesite="Lax",
            max_age=refresh_expires_delta.total_seconds()
        )

        return response, 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Błąd podczas rejestracji: " + str(e)}), 500