
from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pytz
from controllers.user_controller import delete_user_and_data, get_all_users, get_user_by_username
from models.subscription import Subscription
from models import User, BookCollection, WishList, db
from sqlalchemy import func
from routes.activity_tracker import is_user_active
import os

user_bp = Blueprint('user_bp', __name__)

PLAN_LIMITS = {
    "FREE": 50,
    "PREMIUM": 100,
    "PREMIUM+": 200
}

def get_user_plan_and_limit(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return "FREE", PLAN_LIMITS["FREE"]

    sub = Subscription.query.filter_by(
        username=user.username,
        status="ACTIVE"
    ).order_by(Subscription.end_date.desc()).first()

    now = datetime.now(pytz.timezone("Europe/Warsaw"))
    if not sub or sub.end_date <= now:
        return "FREE", PLAN_LIMITS["FREE"]

    return sub.plan, PLAN_LIMITS.get(sub.plan, PLAN_LIMITS["FREE"])

@user_bp.route('/api/delete-account/<string:username>', methods=['DELETE'])
@jwt_required()
def delete_account(username):
    try:
        current_user_id = get_jwt_identity()
        admin_username = os.getenv('ADMIN_USERNAME')
        user = get_user_by_username(username)

        if not user:
            return jsonify({"message": "Użytkownik nie istnieje."}), 404
        
        current_user = db.session.get(User, current_user_id)

        if user.id != int(current_user_id) and current_user.username.lower() != admin_username.lower():
            return jsonify({"message": "Brak uprawnień do usunięcia tego konta."}), 403

        delete_user_and_data(user)

        return jsonify({"message": f"Konto użytkownika '{username}' zostało pomyślnie usunięte."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Błąd podczas usuwania konta użytkownika: {str(e)}"}), 500

@user_bp.route('/api/user/<string:username>', methods=['GET'])
@jwt_required()
def get_user(username):
    try:
        user = User.query.filter(func.lower(User.username) == username.lower()).first()

        if not user:
            return jsonify({"message": "Użytkownik nie istnieje."}), 404

        active_subscription = Subscription.query.filter_by(
            username=username,
            status="ACTIVE"
        ).order_by(Subscription.end_date.desc()).first()

        book_collection = BookCollection.query.filter_by(user_id=user.id).all()
        book_collection_data = [book.to_dict() for book in book_collection]
    
        wish_list = WishList.query.filter_by(user_id=user.id).all()
        wish_list_data = [book.to_dict() for book in wish_list]

        return jsonify({
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar,
            "github_id": user.github_id,
            "discord_id": user.discord_id,
            "premium": active_subscription.plan if active_subscription else None,
            "premium_expiration": active_subscription.end_date.isoformat() if active_subscription else None,
            "account_created": user.created_at.isoformat(),
            "account_created": user.created_at.isoformat(),
            "book_collection": book_collection_data,
            "wish_list": wish_list_data
        }), 200
    except Exception as e:
        return jsonify({"message": f"Błąd podczas pobierania danych użytkownika: {str(e)}"}), 500

@user_bp.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        users = get_all_users()
        user_list = [{
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar or "",
            "is_active": is_user_active(user.id)
        } for user in users]
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({"message": f"Błąd podczas pobierania danych użytkowników: {str(e)}"}), 500