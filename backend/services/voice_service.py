# ElevenLabs Voice Service
import requests
from config import Config

class VoiceService:
    def __init__(self):
        self.api_key = Config.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"
    
    def transcribe_audio(self, audio_file):
        """Transcribe audio using ElevenLabs (or fallback to OpenAI Whisper)"""
        if not self.api_key:
            # Fallback: use OpenAI Whisper if available
            return self._transcribe_with_openai(audio_file)
        
        try:
            # ElevenLabs doesn't have direct transcription, so we'll use OpenAI Whisper
            return self._transcribe_with_openai(audio_file)
        except Exception as e:
            print(f"Voice transcription error: {e}")
            return None
    
    def _transcribe_with_openai(self, audio_file):
        """Transcribe using OpenAI Whisper API"""
        try:
            import openai
            from config import Config
            
            if not Config.OPENAI_API_KEY:
                return None
            
            client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
            
            audio_file.seek(0)  # Reset file pointer
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ru"
            )
            return transcript.text
        except Exception as e:
            print(f"OpenAI Whisper error: {e}")
            return None

# Create global instance
voice_service = VoiceService()

