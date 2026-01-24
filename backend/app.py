# Main Flask Application
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config

from routes.auth import auth_bp
from routes.services import services_bp
from routes.bookings import bookings_bp
from routes.clients import clients_bp
from routes.companies import companies_bp
from routes.maps import maps_bp

app = Flask(__name__)
app.config.from_object(Config)
# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8000", "http://127.0.0.1:8000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(services_bp, url_prefix='/api/services')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(clients_bp, url_prefix='/api/clients')
app.register_blueprint(companies_bp, url_prefix='/api/companies')
app.register_blueprint(maps_bp, url_prefix='/api/maps')

# ---------------- VOICE ----------------

@app.route('/api/voice/transcribe', methods=['POST'])
def transcribe_audio():
    from services.voice_service import voice_service

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400

    audio_file = request.files['audio']
    transcript = voice_service.transcribe_audio(audio_file)

    if transcript:
        return jsonify({'text': transcript}), 200

    return jsonify({'error': 'Transcription failed'}), 500


# ---------------- FAVORITES ----------------

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    from services.supabase_service import supabase_service

    client_id = request.args.get('client_id', default=1, type=int)
    favorites = supabase_service.get_favorites(client_id)

    return jsonify({'favorites': favorites}), 200


@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    from services.supabase_service import supabase_service

    data = request.get_json(silent=True) or {}

    client_id = data.get('client_id', 1)
    service_id = data.get('service_id')

    if not service_id:
        return jsonify({'error': 'service_id is required'}), 400

    try:
        result = supabase_service.add_favorite(client_id, service_id)
        data = result.data[0] if result.data else {}
        return jsonify(data), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/favorites/<int:service_id>', methods=['DELETE'])
def remove_favorite(service_id):
    from services.supabase_service import supabase_service

    client_id = request.args.get('client_id', default=1, type=int)

    try:
        supabase_service.remove_favorite(client_id, service_id)
        return jsonify({'message': 'Removed from favorites'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------- HEALTH ----------------

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'Cobalt API is running', 'endpoints': {
        'health': '/api/health',
        'auth': '/api/auth',
        'services': '/api/services',
        'bookings': '/api/bookings'
    }}), 200


if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )
