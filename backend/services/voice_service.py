import requests
from backend.config import Config


class VoiceService:
    def __init__(self):
        self.api_key = Config.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1/speech-to-text"

    def transcribe_audio(self, audio_file):
        """
        Transcribe audio using ElevenLabs Scribe v2
        """
        if not self.api_key:
            raise RuntimeError("ELEVENLABS_API_KEY is missing")

        headers = {
            "xi-api-key": self.api_key
        }

        files = {
            "file": (audio_file.filename, audio_file, audio_file.mimetype)
        }

        data = {
            "model_id": "scribe_v2",
            "language": "auto"  # або "ru", "uk", "en"
        }

        response = requests.post(
            self.base_url,
            headers=headers,
            files=files,
            data=data,
            timeout=30
        )

        if response.status_code != 200:
            raise RuntimeError(f"Scribe v2 error: {response.text}")

        result = response.json()

        return result.get("text")


# global instance
voice_service = VoiceService()
