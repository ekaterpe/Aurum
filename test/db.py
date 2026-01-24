import psycopg2
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

url = os.getenv("SUPABASE_URL", "")
key = os.getenv("SUPABASE_KEY", "")

supebase : Client = create_client(url, key)

profiles = supebase.table("users").select("*").execute()
print(profiles.data)