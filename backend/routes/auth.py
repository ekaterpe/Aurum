# Authentication Routes
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from utils.validators import validate_email, validate_phone, hash_password, validate_password, validate_user_type
import secrets

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'client')
    
    # Validation
    if not email:
        return jsonify({'error': 'Email or phone is required'}), 400
    
    is_email = validate_email(email)
    is_phone = validate_phone(email)
    
    if not (is_email or is_phone):
        return jsonify({'error': 'Invalid email or phone format'}), 400
    
    is_valid, error = validate_password(password)
    if not is_valid:
        return jsonify({'error': error}), 400
    
    if not validate_user_type(user_type):
        return jsonify({'error': 'Invalid user type'}), 400
    
    # Check if user exists
    existing_user = supabase_service.get_user_by_email(email)
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    # Create user
    password_hash = hash_password(password)
    try:
        result = supabase_service.create_user(email, password_hash, user_type)
        user = result.data[0] if result.data else None
        
        if user:
            # If user is a company, create a company entry
            if user_type == 'company':
                try:
                    supabase_service.create_company(user['id'], email)
                except Exception as e:
                    print(f"Error creating company entry: {e}")
            
            # Generate token (simplified - in production use JWT)
            token = secrets.token_urlsafe(32)
            return jsonify({
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'user_type': user['user_type']
                }
            }), 201
        else:
            return jsonify({'error': 'Error creating user'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'client')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Get user
    user = supabase_service.get_user_by_email(email)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check password
    password_hash = hash_password(password)
    if user['password_hash'] != password_hash:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check user type
    if user['user_type'] != user_type:
        return jsonify({'error': 'Invalid user type'}), 401
    
    # Generate token
    token = secrets.token_urlsafe(32)
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'user_type': user['user_type']
        }
    }), 200

