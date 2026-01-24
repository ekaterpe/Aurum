# Company Routes
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

companies_bp = Blueprint('companies', __name__)

@companies_bp.route('/settings', methods=['GET'])
def get_company_settings():
    # In production, get from token
    company_id = request.args.get('company_id', 1)
    settings = supabase_service.get_company_settings(company_id)
    return jsonify(settings or {}), 200

@companies_bp.route('/settings', methods=['PUT'])
def update_company_settings():
    data = request.json
    # In production, get from token
    company_id = data.get('company_id', 1)
    
    try:
        result = supabase_service.update_company_settings(company_id, data)
        return jsonify(result.data[0] if result.data else {}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/masters', methods=['GET'])
def get_masters():
    # In production, get from token
    company_id = request.args.get('company_id', 1)
    masters = supabase_service.get_company_masters(company_id)
    return jsonify({'masters': masters}), 200

@companies_bp.route('/masters', methods=['POST'])
def create_master():
    data = request.json
    # In production, get from token
    company_id = data.get('company_id', 1)
    
    master_data = {
        'company_id': company_id,
        'name': data.get('name'),
        'photo': data.get('photo'),
        'specialization': data.get('specialization')
    }
    
    try:
        result = supabase_service.create_master(master_data)
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/masters/<int:master_id>', methods=['PUT'])
def update_master(master_id):
    data = request.json
    try:
        result = supabase_service.update_master(master_id, data)
        return jsonify(result.data[0] if result.data else {}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/masters/<int:master_id>', methods=['DELETE'])
def delete_master(master_id):
    try:
        supabase_service.delete_master(master_id)
        return jsonify({'message': 'Master deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/promotions', methods=['GET'])
def get_promotions():
    # In production, get from token
    company_id = request.args.get('company_id', 1)
    result = supabase_service.get_table('promotions').select('*').eq('company_id', company_id).execute()
    return jsonify({'promotions': result.data}), 200

@companies_bp.route('/promotions', methods=['POST'])
def create_promotion():
    data = request.json
    # In production, get from token
    company_id = data.get('company_id', 1)
    
    promotion_data = {
        'company_id': company_id,
        'type': data.get('type'),
        'description': data.get('description'),
        'discount': data.get('discount'),
        'conditions': data.get('conditions', {})
    }
    
    try:
        result = supabase_service.get_table('promotions').insert(promotion_data).execute()
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/promotions/<int:promotion_id>', methods=['DELETE'])
def delete_promotion(promotion_id):
    try:
        supabase_service.get_table('promotions').delete().eq('id', promotion_id).execute()
        return jsonify({'message': 'Promotion deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

