# Validators
import re
import hashlib

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number (international format)"""
    # Remove all non-digit characters except +
    digits = re.sub(r'[^\d+]', '', phone)
    # Check if it's a valid phone number (at least 10 digits)
    digits_only = re.sub(r'\D', '', phone)
    return len(digits_only) >= 10

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, None

def validate_user_type(user_type):
    """Validate user type"""
    return user_type in ['client', 'company']

