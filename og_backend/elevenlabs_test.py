import sounddevice as sd
import soundfile as sf
import numpy as np
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
from elevenlabs.types import VoiceSettings
import os

load_dotenv(".env")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("VOICE_ID")

# speech to text model 2
# eleven_multilingual_v2

# speech to text model 3
# eleven_v3

# text to speech model 1
# scribe_v1

# text to speech model 2
# scribe_v2

elevenlabs = ElevenLabs(
  api_key=ELEVENLABS_API_KEY
)

def speak(text: str, output_filename: str = None) -> bytes:
    audio_generator = elevenlabs.text_to_speech.convert(
        text=text,
        voice_id=VOICE_ID,
        model_id="eleven_v3",
        voice_settings=VoiceSettings(
            stability=0.5,
            similarity_boost=0.75,
        ),
        output_format="mp3_44100_128",
    )
    
    # Collect all audio bytes
    audio_bytes = b"".join(audio_generator)
    
    if output_filename:
        with open(output_filename, "wb") as f:
            f.write(audio_bytes)
            
    return audio_bytes

def record_audio(filename: str, duration: int = 5, fs: int = 44100):
    print(f"Recording for {duration} seconds...")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()  # Wait until recording is finished
    print("Recording finished.")
    sf.write(filename, recording, fs)

def transcribe(file_path: str):
    print(f"Transcribing {file_path}...")
    with open(file_path, "rb") as audio_file:
        transcription = elevenlabs.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v2"
        )
    return transcription

if __name__ == "__main__":
    conversation_text = ""
    try:
        with open("conversation.txt", "r", encoding="utf-8") as f:
            conversation_text = f.read()
        print(f"Loaded {len(conversation_text)} characters from conversation.txt")
    except FileNotFoundError:
        print("Warning: conversation.txt not found.")

    action = input("Choose action: (1) TTS Test (2) Record & Transcribe: ")
    
    if action == "1":
        text_to_say_2 = "In French, especially in Quebec, “je veux” sounds a bit direct when ordering. A more polite and natural option is: \"Je voudrais un latte moyen.\""
        text_to_say = "yap2learn. Learning to yap."
        output_file = "test_audio.mp3"
        print(f"Generating audio for: '{conversation_text}'")
        audio = speak(conversation_text, output_filename=output_file)
        play(audio)
        
        # Transcribe the TTS output
        if os.path.exists(output_file):
            result = transcribe(output_file)
            print("\n--- Transcription Result ---")
            print(result.text)

    elif action == "2":
        output_file = "my_recording.wav"
        record_audio(output_file, duration=5)
        
        if os.path.exists(output_file):
            result = transcribe(output_file)
            print("\n--- Transcription Result ---")
            print(result.text)
            
    else:
        print("Invalid selection.")


