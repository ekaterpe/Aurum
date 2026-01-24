from config import Config

# Try to import SerpApi, but don't fail if not installed
GoogleSearch = None  # type: ignore
SERPAPI_AVAILABLE = False

try:
    from serpapi import GoogleSearch
    SERPAPI_AVAILABLE = True
except ImportError:
    print("Warning: serpapi not installed. Install with: pip install google-search-results")

class MapsService:
    def __init__(self):
        self.api_key = Config.GOOGLE_MAPS_API_KEY
        # 'client' property for compatibility checks in routes
        self.client = True if self.api_key and SERPAPI_AVAILABLE else None
        
        if not self.api_key:
            print("Warning: GOOGLE_MAPS_API_KEY not provided. Map searches will not work.")
        elif not SERPAPI_AVAILABLE:
            print("Warning: serpapi package not available. Map searches will not work.")

    def search_places(self, query, location=None, radius=10000, type=None):
        """
        Search for places using SerpApi Google Maps engine.
        This is the main method used by routes/services.py
        
        Args:
            query: Search query string
            location: dict with 'lat' and 'lng' keys
            radius: Search radius in meters (not directly used by SerpApi, but kept for API compatibility)
            type: Place type filter
        
        Returns:
            List of place dictionaries
        """
        if not self.client or not GoogleSearch:
            print("Maps service not available. Skipping place search.")
            return []

        try:
            params = {
                "engine": "google_maps",
                "q": query if not type else f"{type} {query}",
                "api_key": self.api_key,
            }
            
            # Add location if provided
            if location and isinstance(location, dict):
                lat = location.get('lat')
                lng = location.get('lng')
                if lat and lng:
                    params["ll"] = f"@{lat},{lng},14z"
            
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            local_results = results.get("local_results", [])
            
            # Transform results to a consistent format
            places = []
            for result in local_results:
                places.append({
                    'place_id': result.get('place_id', ''),
                    'name': result.get('title', ''),
                    'address': result.get('address', ''),
                    'rating': result.get('rating', 0),
                    'location': {
                        'lat': result.get('gps_coordinates', {}).get('latitude'),
                        'lng': result.get('gps_coordinates', {}).get('longitude')
                    },
                    'phone': result.get('phone', ''),
                    'website': result.get('website', ''),
                    'thumbnail': result.get('thumbnail', '')
                })
            
            return places
        except Exception as e:
            print(f"SerpApi place search error: {e}")
            return []

    def google_search(self, query, num_results=10):
        """
        General Google search using SerpApi
        """
        if not self.client or not GoogleSearch:
            print("Maps service not available. Skipping Google search.")
            return []

        try:
            params = {
                "q": query,
                "engine": "google",
                "api_key": self.api_key,
                "num": num_results
            }
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            return results.get("organic_results", [])
        except Exception as e:
            print(f"SerpApi search error: {e}")
            return []

    def geocode(self, address):
        """
        Geocode an address to coordinates using SerpApi
        """
        if not self.client or not GoogleSearch:
            return None
            
        try:
            params = {
                "engine": "google_maps",
                "q": address,
                "api_key": self.api_key,
            }
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            
            if results.get("place_results"):
                place = results["place_results"]
                coords = place.get("gps_coordinates", {})
                return {
                    'lat': coords.get('latitude'),
                    'lng': coords.get('longitude'),
                    'address': place.get('address', address)
                }
            
            # Try from local_results if place_results not found
            local_results = results.get("local_results", [])
            if local_results:
                first = local_results[0]
                coords = first.get("gps_coordinates", {})
                return {
                    'lat': coords.get('latitude'),
                    'lng': coords.get('longitude'),
                    'address': first.get('address', address)
                }
            return None
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None

    def get_place_details(self, place_id):
        """
        Get detailed information about a place using SerpApi
        """
        if not self.client or not GoogleSearch:
            return None
            
        try:
            params = {
                "engine": "google_maps",
                "place_id": place_id,
                "api_key": self.api_key,
            }
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            
            place = results.get("place_results", {})
            if place:
                return {
                    'place_id': place_id,
                    'name': place.get('title', ''),
                    'address': place.get('address', ''),
                    'phone': place.get('phone', ''),
                    'website': place.get('website', ''),
                    'rating': place.get('rating', 0),
                    'reviews_count': place.get('reviews', 0),
                    'type': place.get('type', ''),
                    'hours': place.get('hours', []),
                    'location': {
                        'lat': place.get('gps_coordinates', {}).get('latitude'),
                        'lng': place.get('gps_coordinates', {}).get('longitude')
                    },
                    'thumbnail': place.get('thumbnail', ''),
                    'photos': place.get('photos', []),
                    'reviews': place.get('reviews_link', ''),
                    'description': place.get('description', '')
                }
            return None
        except Exception as e:
            print(f"Place details error: {e}")
            return None

    def calculate_distance(self, origin, destination):
        """
        Calculate distance between two points using Haversine formula
        (SerpApi doesn't have a direct distance API, so we calculate it)
        
        Args:
            origin: dict with 'lat' and 'lng'
            destination: dict with 'lat' and 'lng'
        
        Returns:
            Distance in meters
        """
        import math
        
        if not origin or not destination:
            return None
            
        lat1 = origin.get('lat')
        lng1 = origin.get('lng')
        lat2 = destination.get('lat')
        lng2 = destination.get('lng')
        
        if None in [lat1, lng1, lat2, lng2]:
            return None
        
        # Haversine formula
        R = 6371000  # Earth's radius in meters
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c  # Distance in meters

    def get_directions(self, origin, destination):
        """
        Get directions using SerpApi Google Maps Directions
        """
        if not self.client or not GoogleSearch:
            return None
            
        try:
            # Format origin and destination
            origin_str = f"{origin['lat']},{origin['lng']}" if isinstance(origin, dict) else origin
            dest_str = f"{destination['lat']},{destination['lng']}" if isinstance(destination, dict) else destination
            
            params = {
                "engine": "google_maps_directions",
                "start_addr": origin_str,
                "end_addr": dest_str,
                "api_key": self.api_key,
            }
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            
            directions = results.get("directions", [])
            if directions:
                return {
                    'routes': directions,
                    'distance': results.get('distance', ''),
                    'duration': results.get('duration', ''),
                }
            return None
        except Exception as e:
            print(f"Directions error: {e}")
            return None

    def reverse_geocode(self, lat, lng):
        """
        Get address from coordinates using SerpApi
        """
        if not self.client or not GoogleSearch:
            return None
            
        try:
            params = {
                "engine": "google_maps",
                "q": f"{lat},{lng}",
                "api_key": self.api_key,
            }
            search = GoogleSearch(params)  # type: ignore
            results = search.get_dict()
            
            if results.get("place_results"):
                place = results["place_results"]
                return {
                    'address': place.get('address', f"{lat},{lng}"),
                    'lat': lat,
                    'lng': lng
                }
            return {'address': f"{lat},{lng}", 'lat': lat, 'lng': lng}
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
            return None

# ---------------- Global instance ----------------
maps_service = MapsService()
