# Supabase Service
from config import Config

class SupabaseService:
    def __init__(self):
        self.supabase = None
        if Config.SUPABASE_URL and Config.SUPABASE_KEY:
            try:
                from supabase import create_client
                self.supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
            except Exception as e:
                print(f"Warning: Could not connect to Supabase: {e}")
        else:
            print("Warning: SUPABASE_URL or SUPABASE_KEY not provided. Database features will be disabled.")
    
    def get_table(self, table_name):
        if not self.supabase:
            return None
        return self.supabase.table(table_name)
    
    # User operations
    def create_user(self, email, password_hash, user_type):
        return self.get_table('users').insert({
            'email': email,
            'password_hash': password_hash,
            'user_type': user_type
        }).execute()
    
    def get_user_by_email(self, email):
        result = self.get_table('users').select('*').eq('email', email).execute()
        return result.data[0] if result.data else None
    
    def get_user(self, user_id):
        result = self.get_table('users').select('*').eq('id', user_id).execute()
        return result.data[0] if result.data else None
    
    # Service operations
    def search_services(self, query, filters):
        table = self.get_table('services')
        if not table:
            return []
        
        query_builder = table.select('*')
        
        if query:
            # Supabase text search
            query_builder = query_builder.or_(f'name.ilike.%{query}%,description.ilike.%{query}%')
        
        if filters.get('category'):
            query_builder = query_builder.eq('category', filters['category'])
        
        try:
            result = query_builder.execute()
            return result.data
        except:
            # Fallback: get all and filter in Python
            try:
                result = table.select('*').execute()
                services = result.data
                if query:
                    query_lower = query.lower()
                    services = [s for s in services if query_lower in s.get('name', '').lower() or query_lower in s.get('description', '').lower()]
                if filters.get('category'):
                    services = [s for s in services if s.get('category') == filters['category']]
                return services
            except:
                return []
    
    def get_service(self, service_id):
        result = self.get_table('services').select('*').eq('id', service_id).execute()
        return result.data[0] if result.data else None
    
    def get_service_masters(self, service_id):
        result = self.get_table('masters').select('*').eq('service_id', service_id).execute()
        return result.data
    
    def get_service_reviews(self, service_id):
        result = self.get_table('reviews').select('*').eq('service_id', service_id).execute()
        return result.data
    
    def get_service_examples(self, service_id):
        result = self.get_table('work_examples').select('*').eq('service_id', service_id).execute()
        return result.data
    
    # Booking operations
    def create_booking(self, booking_data):
        return self.get_table('bookings').insert(booking_data).execute()
    
    def get_user_bookings(self, user_id):
        result = self.get_table('bookings').select('*').eq('client_id', user_id).execute()
        return result.data
    
    def update_booking(self, booking_id, update_data):
        return self.get_table('bookings').update(update_data).eq('id', booking_id).execute()
    
    def delete_booking(self, booking_id):
        return self.get_table('bookings').delete().eq('id', booking_id).execute()
    
    # Favorites
    def add_favorite(self, client_id, service_id):
        return self.get_table('favorites').insert({
            'client_id': client_id,
            'service_id': service_id
        }).execute()
    
    def remove_favorite(self, client_id, service_id):
        return self.get_table('favorites').delete().eq('client_id', client_id).eq('service_id', service_id).execute()
    
    def get_favorites(self, client_id):
        result = self.get_table('favorites').select('*').eq('client_id', client_id).execute()
        return result.data
    
    # Company operations
    def create_company(self, user_id, email):
        """Create a company entry when a user registers as a company"""
        table = self.get_table('companies')
        if not table:
            return None
        return table.insert({
            'user_id': user_id,
            'name': email.split('@')[0],  # Default name from email
            'email': email,
        }).execute()
    
    def get_company_by_user_id(self, user_id):
        """Get company by user ID"""
        table = self.get_table('companies')
        if not table:
            return None
        result = table.select('*').eq('user_id', user_id).execute()
        return result.data[0] if result.data else None
    
    def get_company_settings(self, company_id):
        result = self.get_table('companies').select('*').eq('id', company_id).execute()
        return result.data[0] if result.data else None
    
    def update_company_settings(self, company_id, settings):
        return self.get_table('companies').update(settings).eq('id', company_id).execute()
    
    def get_company_masters(self, company_id):
        result = self.get_table('masters').select('*').eq('company_id', company_id).execute()
        return result.data
    
    # Service operations for companies
    def create_service(self, service_data):
        """Create a new service"""
        table = self.get_table('services')
        if not table:
            return None
        return table.insert(service_data).execute()
    
    def get_company_services(self, company_id):
        """Get all services for a company"""
        table = self.get_table('services')
        if not table:
            return []
        result = table.select('*').eq('company_id', company_id).execute()
        return result.data
    
    def update_service(self, service_id, service_data):
        """Update a service"""
        table = self.get_table('services')
        if not table:
            return None
        return table.update(service_data).eq('id', service_id).execute()
    
    def delete_service(self, service_id):
        """Delete a service"""
        table = self.get_table('services')
        if not table:
            return None
        return table.delete().eq('id', service_id).execute()
    
    def create_master(self, master_data):
        return self.get_table('masters').insert(master_data).execute()
    
    def update_master(self, master_id, master_data):
        return self.get_table('masters').update(master_data).eq('id', master_id).execute()
    
    def delete_master(self, master_id):
        return self.get_table('masters').delete().eq('id', master_id).execute()

# Create global instance
supabase_service = SupabaseService()

