from datetime import timedelta
import random
import secrets
from extensions import bcrypt
from flask import Blueprint, redirect, request, jsonify, url_for, make_response
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
import os
from sqlalchemy import func
from routes.activity_tracker import set_user_active
from models.user import User
from extensions import discord, oauth
from models import db

oauth_bp = Blueprint('oauth_bp', __name__)

def generate_tokens(user_id):
    access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(minutes=10))
    refresh_token = create_refresh_token(identity=str(user_id), expires_delta=timedelta(days=1))
    return access_token, refresh_token


def build_auth_response(user):
    access_token, refresh_token = generate_tokens(user.id)

    response = make_response(redirect(f"{os.getenv('URL')}/auth-callback"))

    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=False,   # localhost, inaczej True
        samesite="Lax",
        max_age=600
    )

    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,   # localhost, inaczej True
        samesite="Lax",
        max_age=86400
    )

    return response

@oauth_bp.route('/api/login/discord')
def login_discord():
    return discord.create_session(scope=["identify", "email"])

@oauth_bp.route('/api/login/github')
def login_github():
    redirect_uri = url_for('oauth_bp.auth_github', _external=True)
    return oauth.github.authorize_redirect(redirect_uri)

@oauth_bp.route('/api/auth/discord')
def auth_discord():
    try:
        if request.args.get("error") == "access_denied":
            response = redirect(f"{os.getenv('URL')}/login")
            response.delete_cookie("session")
            return response

        discord.callback()
        discord_user = discord.fetch_user()

        discord_id = str(discord_user.id)
        username = discord_user.name
        email = discord_user.email
        avatar_url = discord_user.avatar_url

        if not email:
            return jsonify({"message": "Brak emaila z Discord"}), 400

        user = User.query.filter_by(discord_id=discord_id).first()

        if not user:
            user = User.query.filter(func.lower(User.email) == email.lower()).first()

        if not user:
            user = User.query.filter(func.lower(User.username) == username.lower()).first()

        existing_email = User.query.filter(func.lower(User.email) == email.lower()).first()

        if existing_email and not user:
            return jsonify({"message": "Email już istnieje"}), 400

        if user:
            if not user.discord_id:
                user.discord_id = discord_id
            if not user.avatar and avatar_url:
                user.avatar = avatar_url
        else:
            if User.query.filter_by(username=username).first():
                username = f"{username}_{random.randint(1000,9999)}"

            user = User(
                username=username,
                email=email,
                password=bcrypt.generate_password_hash(secrets.token_hex(32)).decode('utf-8'),
                avatar=avatar_url,
                discord_id=discord_id
            )
            db.session.add(user)

        db.session.commit()
        set_user_active(user.id)

        return build_auth_response(user)

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Błąd Discord: {str(e)}"}), 500


@oauth_bp.route('/api/auth/github')
def auth_github():
    try:
        if request.args.get("error") == "access_denied":
            response = redirect(f"{os.getenv('URL')}/login")
            response.delete_cookie("session")
            return response

        oauth.github.authorize_access_token()
        user_data = oauth.github.get('user').json()

        github_id = str(user_data.get("id"))
        email = user_data.get("email")
        username = user_data.get("login")
        avatar_url = user_data.get("avatar_url")

        if not isinstance(email, str) or not email:
            emails = oauth.github.get('user/emails').json()

            email = None
            for em in emails:
                if em.get("primary") and em.get("verified"):
                    email = em.get("email")
                    break

            if not email:
                return jsonify({"message": "Brak zweryfikowanego emaila z GitHub"}), 400

        link_account = request.args.get("link", "false").lower() == "true"

        if link_account:
            auth_header = request.headers.get("Authorization")

            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"message": "Brak tokenu"}), 401

            try:
                token_str = auth_header.split(" ")[1]
                decoded = decode_token(token_str)

                if not isinstance(decoded.get("sub"), str):
                    return jsonify({"message": "Nieprawidłowy token"}), 401
                
                if not decoded["sub"].isdigit():
                    return jsonify({"message": "Nieprawidłowy token"}), 401

                user_id = decoded["sub"]
            except Exception:
                return jsonify({"message": "Nieprawidłowy token"}), 401

            user = db.session.get(User, user_id)

            if not user:
                return jsonify({"message": "Użytkownik nie istnieje"}), 404

            if user.github_id and user.github_id != github_id:
                return jsonify({"message": "GitHub już przypisany"}), 400

            user.github_id = github_id
            if not user.avatar and avatar_url:
                user.avatar = avatar_url

            db.session.commit()

            return jsonify({"message": "Konto powiązane"}), 200

        user = User.query.filter_by(github_id=github_id).first()

        if not user:
            user = User.query.filter(func.lower(User.email) == email.lower()).first()

        if not user:
            user = User.query.filter(func.lower(User.username) == username.lower()).first()

        if user:
            if not user.github_id:
                user.github_id = github_id
            if not user.avatar and avatar_url:
                user.avatar = avatar_url
        else:
            if User.query.filter_by(username=username).first():
                username = f"{username}_{random.randint(1000,9999)}"

            user = User(
                username=username,
                email=email,
                password=bcrypt.generate_password_hash(secrets.token_hex(32)).decode('utf-8'),
                avatar=avatar_url,
                github_id=github_id
            )
            db.session.add(user)

        db.session.commit()
        set_user_active(user.id)

        return build_auth_response(user)

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Błąd GitHub: {str(e)}"}), 500