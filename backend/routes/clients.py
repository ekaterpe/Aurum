# Client Routes
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/settings', methods=['GET'])
def get_client_settings():
    # In production, get from token
    user_id = request.args.get('user_id', 1)
    user = supabase_service.get_user(user_id)
    return jsonify(user or {}), 200

@clients_bp.route('/settings', methods=['PUT'])
def update_client_settings():
    data = request.json
    # In production, get from token
    user_id = data.get('user_id', 1)
    
    update_data = {
        'full_name': data.get('full_name'),
        'email': data.get('email'),
        'address': data.get('address')
    }
    
    try:
        result = supabase_service.get_table('users').update(update_data).eq('id', user_id).execute()
        return jsonify(result.data[0] if result.data else {}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clients_bp.route('/blacklist', methods=['POST'])
def add_to_blacklist():
    data = request.json
    # In production, get from token
    client_id = data.get('client_id', 1)
    
    blacklist_data = {
        'client_id': client_id,
        'company_id': data.get('company_id')
    }
    
    try:
        result = supabase_service.get_table('client_blacklist').insert(blacklist_data).execute()
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clients_bp.route('/blacklist/<int:company_id>', methods=['DELETE'])
def remove_from_blacklist(company_id):
    # In production, get from token
    client_id = request.args.get('client_id', 1)
    
    try:
        supabase_service.get_table('client_blacklist').delete().eq('client_id', client_id).eq('company_id', company_id).execute()
        return jsonify({'message': 'Removed from blacklist'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

