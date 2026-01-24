# Bookings Routes
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('', methods=['POST'])
def create_booking():
    data = request.json
    # In production, get user_id from token
    user_id = data.get('user_id', 1)  # Temporary
    
    booking_data = {
        'client_id': user_id,
        'service_id': data.get('service_id'),
        'master_id': data.get('master_id'),
        'company_id': data.get('company_id'),
        'date': data.get('date'),
        'time': data.get('time'),
        'status': 'pending'
    }
    
    try:
        result = supabase_service.create_booking(booking_data)
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('', methods=['GET'])
def get_bookings():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    bookings = supabase_service.get_user_bookings(user_id)
    return jsonify({'bookings': bookings}), 200

@bookings_bp.route('/<int:booking_id>/reschedule', methods=['PUT'])
def reschedule_booking(booking_id):
    data = request.json
    update_data = {
        'date': data.get('date'),
        'time': data.get('time'),
        'status': 'pending'
    }
    
    try:
        result = supabase_service.update_booking(booking_id, update_data)
        return jsonify(result.data[0] if result.data else {}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    try:
        supabase_service.delete_booking(booking_id)
        return jsonify({'message': 'Booking cancelled'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

