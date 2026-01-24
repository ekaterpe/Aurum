// ElevenLabs Voice Input Integration
class VoiceService {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.apiKey = CONFIG.ELEVENLABS_API_KEY;
        this.onTranscription = null; // Callback for when transcription is complete
    }

    async startRecording(buttonElement) {
        if (this.isRecording) {
            return this.stopRecording();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const text = await this.processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                
                // Call callback with transcription result
                if (text && this.onTranscription) {
                    this.onTranscription(text);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            if (buttonElement) {
                buttonElement.classList.add('recording');
            }

            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please check permissions.');
            return false;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            return true;
        }
        return false;
    }

    async processAudio(audioBlob) {
        try {
            // Send audio to backend for processing with OpenAI Whisper
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            const response = await fetch(`${CONFIG.API_URL}/voice/transcribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            
            // Return transcribed text
            if (data.text) {
                return data.text;
            }
            
            return null;
        } catch (error) {
            console.error('Error processing audio:', error);
            // Fallback to Web Speech API if backend fails
            return this.fallbackSpeechRecognition();
        }
    }

    fallbackSpeechRecognition() {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                reject(new Error('Speech recognition error'));
            };

            recognition.start();
        });
    }

    // Direct speech recognition using Web Speech API (no recording needed)
    startSpeechRecognition() {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const isFinal = event.results[0].isFinal;
                
                if (this.onTranscription) {
                    this.onTranscription(transcript, isFinal);
                }
                
                if (isFinal) {
                    resolve(transcript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                reject(new Error('Speech recognition error: ' + event.error));
            };

            recognition.onend = () => {
                this.isRecording = false;
            };

            this.isRecording = true;
            recognition.start();
        });
    }

    async transcribeAudio(audioBlob) {
        return this.processAudio(audioBlob);
    }
}

// Create global voice service instance
const voiceService = new VoiceService();

