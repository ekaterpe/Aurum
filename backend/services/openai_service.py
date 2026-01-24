# OpenAI Service
from config import Config

class OpenAIService:
    def __init__(self):
        self.client = None
        if Config.OPENAI_API_KEY:
            try:
                import openai
                self.client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
            except Exception as e:
                print(f"Warning: Could not initialize OpenAI client: {e}")
                self.client = None
        else:
            print("Warning: OPENAI_API_KEY not provided. AI features will be disabled.")
    
    def process_search_query(self, query):
        """Process search query and return enhanced search terms"""
        if not self.client:
            return query  # Return original query if no API key
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a service search assistant. Extract keywords from the user's query."},
                    {"role": "user", "content": query}
                ],
                max_tokens=100,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI error: {e}")
            return query
    
    def generate_google_maps_filters(self, query):
        """Generate Google Maps search filters based on user query using AI"""
        if not self.client:
            return None
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a Google Maps search assistant. Based on the user's query, determine what type of service or business they're looking for. Return a JSON object with: 'type' (business type like 'hair salon', 'massage', 'repair shop'), 'keyword' (main search keyword), and 'location' (if mentioned)."},
                    {"role": "user", "content": query}
                ],
                max_tokens=150,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Google Maps filter error: {e}")
            return None
    
    def generate_recommendations(self, user_history, available_services):
        """Generate service recommendations based on user history"""
        if not self.client:
            return available_services[:5]  # Return top 5 if no API key
        
        try:
            history_text = ", ".join([s.get('name', '') for s in user_history[:5]])
            services_text = ", ".join([s.get('name', '') for s in available_services[:10]])
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Ты помощник для рекомендации услуг. Рекомендуй услуги на основе истории пользователя."},
                    {"role": "user", "content": f"История: {history_text}. Доступные услуги: {services_text}. Рекомендуй 5 услуг."}
                ],
                max_tokens=200,
                temperature=0.5
            )
            # Parse recommendations (simplified)
            return available_services[:5]
        except Exception as e:
            print(f"OpenAI recommendation error: {e}")
            return available_services[:5]

# Create global instance
openai_service = OpenAIService()

