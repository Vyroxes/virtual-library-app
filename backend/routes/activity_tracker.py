from datetime import datetime, timedelta

active_users = {}

ACTIVITY_TIMEOUT = 2

def set_user_active(user_id):
    active_users[user_id] = datetime.now()

def is_user_active(user_id):
    if user_id not in active_users:
        return False
    
    last_activity = active_users[user_id]
    return datetime.now() - last_activity < timedelta(minutes=ACTIVITY_TIMEOUT)

def cleanup_inactive_users():
    now = datetime.now()
    inactive_threshold = now - timedelta(minutes=ACTIVITY_TIMEOUT)
    
    to_remove = [user_id for user_id, last_active in active_users.items() 
                if last_active < inactive_threshold]
    
    for user_id in to_remove:
        active_users.pop(user_id, None)