// Maps Service - Using Backend SerpApi for all map functionality
class MapsService {
    constructor() {
        this.userLocation = null;
        this.apiUrl = CONFIG.API_URL;
    }

    /**
     * Get user's current location using browser geolocation
     */
    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        resolve(this.userLocation);
                    },
                    (error) => {
                        console.warn('Geolocation error:', error);
                        // Default to a central location if geolocation fails
                        this.userLocation = { lat: 60.1699, lng: 24.9384 }; // Helsinki
                        resolve(this.userLocation);
                    },
                    { timeout: 10000 }
                );
            } else {
                // Default location
                this.userLocation = { lat: 60.1699, lng: 24.9384 };
                resolve(this.userLocation);
            }
        });
    }

    /**
     * Search for places using SerpApi via backend
     */
    async searchPlaces(query, options = {}) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({
                    query,
                    location: options.location || this.userLocation,
                    type: options.type
                })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            return data.places || [];
        } catch (error) {
            console.error('Place search error:', error);
            return [];
        }
    }

    /**
     * Geocode an address to coordinates
     */
    async geocodeAddress(address) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/geocode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({ address })
            });

            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    /**
     * Reverse geocode - get address from coordinates
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/reverse-geocode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({ lat, lng })
            });

            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    /**
     * Get place details by place ID
     */
    async getPlaceDetails(placeId) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/place/${placeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get place details');
            }

            return await response.json();
        } catch (error) {
            console.error('Place details error:', error);
            return null;
        }
    }

    /**
     * Calculate distance between two points
     */
    async calculateDistance(origin, destination) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/distance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({ origin, destination })
            });

            if (!response.ok) {
                throw new Error('Distance calculation failed');
            }

            const data = await response.json();
            return data.distance_meters / 1000; // Return in km
        } catch (error) {
            console.error('Distance calculation error:', error);
            // Fallback: calculate locally using Haversine
            return this.calculateDistanceLocal(origin, destination);
        }
    }

    /**
     * Local distance calculation using Haversine formula (fallback)
     */
    calculateDistanceLocal(origin, destination) {
        if (!origin || !destination) return null;
        
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(destination.lat - origin.lat);
        const dLon = this.toRad(destination.lng - origin.lng);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(origin.lat)) * Math.cos(this.toRad(destination.lat)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    /**
     * Get directions between two points
     */
    async getDirections(origin, destination) {
        try {
            const response = await fetch(`${this.apiUrl}/maps/directions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({ origin, destination })
            });

            if (!response.ok) {
                throw new Error('Failed to get directions');
            }

            return await response.json();
        } catch (error) {
            console.error('Directions error:', error);
            return null;
        }
    }

    /**
     * Check if maps service is available
     */
    async checkStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/maps/status`);
            if (!response.ok) return false;
            const data = await response.json();
            return data.available;
        } catch {
            return false;
        }
    }

    /**
     * Format distance for display
     */
    formatDistance(distanceKm) {
        if (distanceKm === null || distanceKm === undefined) {
            return 'Unknown';
        }
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        }
        return `${distanceKm.toFixed(1)} km`;
    }

    /**
     * Render a simple static map image (using OpenStreetMap tiles)
     * This is a fallback since we don't have Google Maps JS API
     */
    renderStaticMap(containerId, location, zoom = 15) {
        const container = document.getElementById(containerId);
        if (!container || !location) return;
        
        // Use OpenStreetMap static tiles
        const lat = location.lat;
        const lng = location.lng;
        
        // Create an iframe with OpenStreetMap
        container.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                frameborder="0" 
                scrolling="no" 
                marginheight="0" 
                marginwidth="0" 
                src="https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}"
                style="border-radius: 8px;">
            </iframe>
            <small style="display: block; text-align: center; margin-top: 4px;">
                <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}" target="_blank">
                    View larger map
                </a>
            </small>
        `;
    }
}

// Create global maps service instance
const mapsService = new MapsService();
