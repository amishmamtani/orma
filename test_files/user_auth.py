import hashlib


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(username, password, email):
    return {
        "username": username,
        "password_hash": hash_password(password),
        "email": email,
        "is_active": True,
    }


def login(username, password, users_db):
    user = users_db.get(username)
    if user is None:
        return None
    if user["password_hash"] == hash_password(password):
        return user
    return None


def deactivate_account(username, users_db):
    if username in users_db:
        users_db[username]["is_active"] = False
    return users_db


def reset_password(username, new_password, users_db):
    if username in users_db:
        users_db[username]["password_hash"] = hash_password(new_password)
    return users_db
