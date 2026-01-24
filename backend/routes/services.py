# Services Routes
from flask import Blueprint, request, jsonify
from services.supabase_service import supabase_service
from services.openai_service import openai_service
from services.maps_service import maps_service

services_bp = Blueprint('services', __name__)

@services_bp.route('/search', methods=['POST'])
def search_services():
    try:
        data = request.get_json(silent=True) or {}
        query = data.get('query', '').strip()
        user_location = data.get('user_location')  # {lat, lng}
        filters = {
            'category': data.get('category', ''),
            'price': data.get('price', ''),
            'rating': data.get('rating', ''),
            'distance': data.get('distance', ''),
        }
        
        all_services = []
        
        # First, search in our database
        try:
            db_services = supabase_service.search_services(query, filters)
            if db_services:
                all_services.extend(db_services)
        except Exception as e:
            print(f"Supabase search error: {e}")
        
        # If no results in database, try to search Google Maps (if available)
        if len(all_services) == 0 and query:
            # Check if maps service is available
            if maps_service and maps_service.client:
                try:
                    # Use OpenAI to generate Google Maps search filters if available
                    maps_filters = None
                    if openai_service and openai_service.client:
                        maps_filters = openai_service.generate_google_maps_filters(query)
                    
                    search_keyword = query
                    place_type = None
                    
                    if maps_filters:
                        search_keyword = maps_filters.get('keyword', query)
                        place_type = maps_filters.get('type')
                    
                    # Search Google Maps
                    google_results = maps_service.search_places(
                        query=search_keyword,
                        location=user_location,
                        radius=10000,  # 10km radius
                        type=place_type
                    )
                    
                    # Convert Google Maps results to service format
                    for place in google_results:
                        all_services.append({
                            'id': f"google_{place.get('place_id', '')}",
                            'name': place.get('name', ''),
                            'company': place.get('name', ''),
                            'address': place.get('address', ''),
                            'rating': place.get('rating', 0),
                            'category': place_type or 'other',
                            'price': 0,  # Price not available from Google Maps
                            'image': place.get('thumbnail'),
                            'description': 'Found via Google Maps',
                            'location': place.get('location', {}),
                            'source': 'google_maps'
                        })
                except Exception as e:
                    print(f"Google Maps search error: {e}")
        
        return jsonify({'services': all_services}), 200
    except Exception as e:
        print(f"Search services error: {e}")
        return jsonify({'error': str(e), 'services': []}), 500

@services_bp.route('/<service_id>', methods=['GET'])
def get_service(service_id):
    # Handle Google Maps service IDs (string starting with "google_")
    if isinstance(service_id, str) and service_id.startswith('google_'):
        place_id = service_id.replace('google_', '')
        # Return a placeholder for Google Maps services
        # In production, you could fetch details from Google Places API
        return jsonify({
            'id': service_id,
            'name': 'Google Maps Service',
            'description': 'This service was found via Google Maps. Contact them directly for more information.',
            'source': 'google_maps',
            'place_id': place_id
        }), 200
    
    # Try to convert to int for regular database services
    try:
        service_id = int(service_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid service ID'}), 400
    
    service = supabase_service.get_service(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    return jsonify(service), 200

@services_bp.route('/<int:service_id>/masters', methods=['GET'])
def get_service_masters(service_id):
    masters = supabase_service.get_service_masters(service_id)
    return jsonify({'masters': masters}), 200

@services_bp.route('/<int:service_id>/reviews', methods=['GET'])
def get_service_reviews(service_id):
    reviews = supabase_service.get_service_reviews(service_id)
    return jsonify({'reviews': reviews}), 200

@services_bp.route('/<int:service_id>/examples', methods=['GET'])
def get_service_examples(service_id):
    examples = supabase_service.get_service_examples(service_id)
    return jsonify({'examples': examples}), 200

@services_bp.route('/<int:service_id>/time-slots', methods=['GET'])
def get_time_slots(service_id):
    master_id = request.args.get('master_id')
    date = request.args.get('date')
    
    # Generate time slots (simplified - in production check actual availability)
    time_slots = []
    for hour in range(9, 18):
        time_slots.append(f"{hour:02d}:00")
    
    return jsonify({'time_slots': time_slots}), 200

# Company service management endpoints
@services_bp.route('/company/<int:company_id>', methods=['GET'])
def get_company_services(company_id):
    """Get all services for a company"""
    try:
        services = supabase_service.get_company_services(company_id)
        return jsonify({'services': services}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/create', methods=['POST'])
def create_service():
    """Create a new service (for companies)"""
    try:
        data = request.get_json()
        company_id = data.get('company_id')
        
        if not company_id:
            return jsonify({'error': 'Company ID is required'}), 400
        
        service_data = {
            'company_id': company_id,
            'name': data.get('name', ''),
            'description': data.get('description', ''),
            'category': data.get('category', 'other'),
            'price': data.get('price', 0),
            'duration': data.get('duration', 60),  # Duration in minutes
            'image': data.get('image'),
        }
        
        result = supabase_service.create_service(service_data)
        if result and result.data:
            return jsonify({'service': result.data[0]}), 201
        return jsonify({'error': 'Failed to create service'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    """Update a service"""
    try:
        data = request.get_json()
        service_data = {
            'name': data.get('name'),
            'description': data.get('description'),
            'category': data.get('category'),
            'price': data.get('price'),
            'duration': data.get('duration'),
            'image': data.get('image'),
        }
        # Remove None values
        service_data = {k: v for k, v in service_data.items() if v is not None}
        
        result = supabase_service.update_service(service_id, service_data)
        if result:
            return jsonify({'success': True}), 200
        return jsonify({'error': 'Failed to update service'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    """Delete a service"""
    try:
        result = supabase_service.delete_service(service_id)
        if result:
            return jsonify({'success': True}), 200
        return jsonify({'error': 'Failed to delete service'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

