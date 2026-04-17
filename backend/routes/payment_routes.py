from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pytz
from sqlalchemy import and_
import stripe
from controllers.payment_controller import create_subscription
from models import User, Subscription, db
import os

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route("/api/payments/create", methods=["POST"])
@jwt_required()
def payments_create():
    data = request.get_json()
    plan = data.get("plan")
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Użytkownik nie istnieje."}), 404

    if plan not in ["PREMIUM", "PREMIUM+", "PREMIUM+_UPGRADE"]:
        return jsonify({"error": "Nieprawidłowy plan. Wybierz PREMIUM, PREMIUM+ lub PREMIUM+_UPGRADE."}), 400

    if plan == "PREMIUM+_UPGRADE":
        premium_sub = Subscription.query.filter_by(
            username=user.username, 
            plan="PREMIUM", 
            status="ACTIVE"
        ).order_by(Subscription.end_date.desc()).first()
        
        if not premium_sub:
            return jsonify({"error": "Nie masz aktywnej subskrypcji PREMIUM do ulepszenia."}), 400
        
        plan = "PREMIUM+"
        poland_timezone = pytz.timezone('Europe/Warsaw')
        now_poland = datetime.now(poland_timezone)
        
        subscription = create_subscription(user, plan)
    else:
        one_day_ago = datetime.now(pytz.timezone('Europe/Warsaw')) - timedelta(days=1)
        existing = Subscription.query.filter(
            and_(
                Subscription.username == user.username,
                Subscription.plan == plan,
                Subscription.status == "PENDING",
                Subscription.start_date > one_day_ago
            )
        ).order_by(Subscription.start_date.desc()).first()
        if existing:
            subscription = existing
        else:
            poland_timezone = pytz.timezone('Europe/Warsaw')
            now_poland = datetime.now(poland_timezone)
            subscription = Subscription(
                username=user.username,
                email=user.email,
                plan=plan,
                status="PENDING",
                start_date=now_poland,
                end_date=now_poland + timedelta(days=30)
            )
            db.session.add(subscription)
            db.session.commit()

    if plan == "PREMIUM":
        amount = 1999
        description = "Pakiet PREMIUM"
    elif plan == "PREMIUM+":
        amount = 1499 if data.get("plan") == "PREMIUM+_UPGRADE" else 3499
        description = "Pakiet PREMIUM+ UPGRADE" if data.get("plan") == "PREMIUM+_UPGRADE" else "Pakiet PREMIUM+"

    session = stripe.checkout.Session.create(
        payment_method_types=['card', 'blik', 'p24', 'link', 'revolut_pay', 'paypal', 'mobilepay'],
        mode='payment',
        line_items=[{
            'price_data': {
                'currency': 'pln',
                'product_data': {'name': description},
                'unit_amount': amount,
            },
            'quantity': 1,
        }],
        customer_email=user.email,
        metadata={
            "userId": user.id,
            "subscriptionId": subscription.id,
            "plan": plan
        },
        success_url=f"{os.getenv('URL')}:5173/premium?status=ok",
        cancel_url=f"{os.getenv('URL')}:5173/premium?status=cancelled",
    )
    subscription.payment_id = session.id
    db.session.commit()

    return jsonify({
        "message": "Przekierowanie do systemu płatności.",
        "payment_url": session.url,
        "subscription_id": subscription.id
    }), 200

@payment_bp.route("/api/payments/set/<string:username>", methods=["POST"])
@jwt_required()
def payments_set(username):
    data = request.get_json()
    plan = data.get("plan")
    status = data.get("status")

    jwt_identity = get_jwt_identity()
    current_user = db.session.get(User, jwt_identity)

    if not current_user:
        return jsonify({"error": "Użytkownik nie istnieje."}), 404

    is_admin = current_user.username == os.getenv("ADMIN_USERNAME")
    
    if not is_admin and current_user.username != username:
        return jsonify({"error": "Brak uprawnień do modyfikacji tej subskrypcji."}), 403
    
    target_user = User.query.filter_by(username=username).first()
    if not target_user:
        return jsonify({"error": f"Użytkownik {username} nie istnieje."}), 404

    if not status or status not in ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']:
        return jsonify({"error": "Nieprawidłowy status."}), 400

    if status == 'CANCELLED':
        subscription = None
    
        if plan and plan in ['PREMIUM', 'PREMIUM+']:
            subscription = Subscription.query.filter_by(
                username=target_user.username,
                plan=plan,
                status='PENDING'
            ).order_by(Subscription.start_date.desc()).first()
        
        if not subscription:
            subscription = Subscription.query.filter_by(
                username=target_user.username,
                plan=plan,
                status='ACTIVE'
            ).order_by(Subscription.start_date.desc()).first()
        
        if not subscription:
            return jsonify({"error": "Nie znaleziono aktywnej subskrypcji do anulowania."}), 404    
    else:
        if not plan or plan not in ['PREMIUM', 'PREMIUM+']:
            return jsonify({"error": "Nieprawidłowy plan."}), 400
        
        subscription = Subscription.query.filter_by(
            username=target_user.username,
            plan=plan
        ).order_by(Subscription.start_date.desc()).first()
        
        if not subscription:
            poland_timezone = pytz.timezone('Europe/Warsaw')
            now_poland = datetime.now(poland_timezone)
            end_date = now_poland + timedelta(days=30)
            
            subscription = Subscription(
                username=target_user.username,
                email=target_user.email,
                plan=plan,
                status='PENDING',
                start_date=now_poland,
                end_date=end_date
            )
            db.session.add(subscription)
            db.session.commit()
        
        if status == 'ACTIVE':
            active_subscriptions = Subscription.query.filter_by(
                username=target_user.username,
                status='ACTIVE'
            ).filter(Subscription.id != subscription.id).all()
            
            for active_sub in active_subscriptions:
                active_sub.status = 'CANCELLED'

            poland_timezone = pytz.timezone('Europe/Warsaw')
            now_poland = datetime.now(poland_timezone)
            subscription.start_date = now_poland
            subscription.end_date = now_poland + timedelta(days=30)

    subscription.status = status
    db.session.commit()
    return jsonify({"message": "Subskrypcja zaktualizowana.", "subscription": subscription.to_dict()}), 200

@payment_bp.route("/api/payments/status/<string:username>", methods=["GET"])
@jwt_required()
def payments_status(username):
    jwt_identity = get_jwt_identity()
    current_user = db.session.get(User, jwt_identity)

    if not current_user:
        return jsonify({"error": "Użytkownik nie istnieje."}), 404

    is_admin = current_user.username == os.getenv("ADMIN_USERNAME")
    
    if not is_admin and current_user.username != username:
        return jsonify({"error": "Brak uprawnień do sprawdzenia tej subskrypcji."}), 403
    
    target_user = User.query.filter_by(username=username).first()
    if not target_user:
        return jsonify({"error": f"Użytkownik {username} nie istnieje."}), 404

    subscription = Subscription.query.filter_by(
        username=target_user.username,
        status="PENDING"
    ).order_by(Subscription.end_date.desc()).first()
    
    if not subscription:
        subscription = Subscription.query.filter_by(
            username=target_user.username,
            status="ACTIVE"
        ).order_by(Subscription.end_date.desc()).first()

    if not subscription:
        return jsonify({
            "message": "Użytkownik nie ma subskrypcji.",
            "has_premium": False,
            "subscription": None
        }), 200

    end_date = subscription.end_date
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=pytz.timezone('Europe/Warsaw'))

    if subscription.status == "ACTIVE" and end_date < datetime.now(pytz.timezone('Europe/Warsaw')):
        subscription.status = "CANCELLED"
        db.session.commit()
        is_active = False
    else:
        is_active = subscription.status == "ACTIVE" and end_date > datetime.now(pytz.timezone('Europe/Warsaw'))
    return jsonify({
        "message": "Użytkownik ma aktywną subskrypcję." if is_active else "Użytkownik ma nieaktywną subskrypcję.",
        "has_premium": is_active,
        "subscription": {
            "status": subscription.status,
            "plan": subscription.plan,
            "end_date": subscription.end_date.isoformat() if is_active else None
        }
    }), 200

@payment_bp.route("/api/payments/webhook", methods=["POST"])
def payments_webhook():
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception as e:
        print("Błąd weryfikacji podpisu: ", str(e))
        return "Nieprawidłowy podpis.", 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata'].get('userId')
        subscription_id = session['metadata'].get('subscriptionId')
        if not user_id or not subscription_id:
            return "Brak wymaganych danych w metadata.", 400

        user = db.session.get(User, user_id)
        subscription = db.session.get(Subscription, subscription_id)
        if user and subscription:
            if not subscription.payment_id:
                subscription.payment_id = session['id']
            if not subscription.payment_intent and session.get('payment_intent'):
                subscription.payment_intent = session['payment_intent']
            if subscription.status == 'PENDING':
                subscription.status = 'ACTIVE'
                subscription.start_date = datetime.now(pytz.timezone('Europe/Warsaw'))
                subscription.end_date = datetime.now(pytz.timezone('Europe/Warsaw')) + timedelta(days=30)

                if subscription.plan == "PREMIUM+":
                    print(f"To jest PREMIUM+, szukam aktywnych PREMIUM dla użytkownika {user.username}")
                    premium_subs = Subscription.query.filter_by(
                        username=subscription.username,
                        plan="PREMIUM",
                        status="ACTIVE"
                    ).all()
                    
                    for premium_sub in premium_subs:
                        premium_sub.status = "CANCELLED"

            db.session.commit()

    if event['type'] in ['payment_intent.succeeded', 'charge.succeeded']:
        obj = event['data']['object']
        payment_intent_id = obj.get('payment_intent') or obj.get('id')
        subscription = Subscription.query.filter_by(payment_intent=payment_intent_id).first()
        if not subscription:
            sessions = stripe.checkout.Session.list(payment_intent=payment_intent_id, limit=1)
            if sessions.data:
                session = sessions.data[0]
                subscription = Subscription.query.filter_by(payment_id=session.id).first()
                if subscription and not subscription.payment_intent:
                    subscription.payment_intent = payment_intent_id
                    db.session.commit()
        if subscription and subscription.status == 'PENDING':
            subscription.status = 'ACTIVE'
            subscription.start_date = datetime.now(pytz.timezone('Europe/Warsaw'))
            subscription.end_date = datetime.now(pytz.timezone('Europe/Warsaw')) + timedelta(days=30)
            db.session.commit()

    return "OK", 200
