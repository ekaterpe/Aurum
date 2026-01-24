# Maps Routes - Using SerpApi for all map functionality
from flask import Blueprint, request, jsonify
from services.maps_service import maps_service

maps_bp = Blueprint('maps', __name__)

@maps_bp.route('/search', methods=['POST'])
def search_places():
    """Search for places"""
    data = request.get_json(silent=True) or {}
    query = data.get('query', '')
    location = data.get('location')  # {lat, lng}
    place_type = data.get('type')
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    places = maps_service.search_places(query, location=location, type=place_type)
    return jsonify({'places': places}), 200

@maps_bp.route('/geocode', methods=['POST'])
def geocode():
    """Convert address to coordinates"""
    data = request.get_json(silent=True) or {}
    address = data.get('address', '')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    result = maps_service.geocode(address)
    if result:
        return jsonify(result), 200
    return jsonify({'error': 'Could not geocode address'}), 404

@maps_bp.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """Convert coordinates to address"""
    data = request.get_json(silent=True) or {}
    lat = data.get('lat')
    lng = data.get('lng')
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    result = maps_service.reverse_geocode(lat, lng)
    if result:
        return jsonify(result), 200
    return jsonify({'error': 'Could not reverse geocode'}), 404

@maps_bp.route('/place/<place_id>', methods=['GET'])
def get_place_details(place_id):
    """Get detailed information about a place"""
    result = maps_service.get_place_details(place_id)
    if result:
        return jsonify(result), 200
    return jsonify({'error': 'Place not found'}), 404

@maps_bp.route('/distance', methods=['POST'])
def calculate_distance():
    """Calculate distance between two points"""
    data = request.get_json(silent=True) or {}
    origin = data.get('origin')  # {lat, lng}
    destination = data.get('destination')  # {lat, lng}
    
    if not origin or not destination:
        return jsonify({'error': 'origin and destination are required'}), 400
    
    distance = maps_service.calculate_distance(origin, destination)
    if distance is not None:
        # Format distance
        if distance < 1000:
            formatted = f"{int(distance)} m"
        else:
            formatted = f"{distance/1000:.1f} km"
        
        return jsonify({
            'distance_meters': distance,
            'distance_formatted': formatted
        }), 200
    return jsonify({'error': 'Could not calculate distance'}), 400

@maps_bp.route('/directions', methods=['POST'])
def get_directions():
    """Get directions between two points"""
    data = request.get_json(silent=True) or {}
    origin = data.get('origin')  # {lat, lng} or address string
    destination = data.get('destination')  # {lat, lng} or address string
    
    if not origin or not destination:
        return jsonify({'error': 'origin and destination are required'}), 400
    
    result = maps_service.get_directions(origin, destination)
    if result:
        return jsonify(result), 200
    return jsonify({'error': 'Could not get directions'}), 404

@maps_bp.route('/status', methods=['GET'])
def maps_status():
    """Check if maps service is available"""
    return jsonify({
        'available': maps_service.client is not None,
        'provider': 'SerpApi'
    }), 200

