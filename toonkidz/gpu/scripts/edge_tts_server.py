from flask import Flask, request, make_response
from flask_cors import CORS
import edge_tts
import asyncio
import logging

# Configure logging - chỉ hiển thị lỗi
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
app = Flask(__name__)

# CORS configuration
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

async def get_available_voices():
    """Get all available voices from Edge TTS"""
    try:
        voices = await edge_tts.list_voices()
        return voices
    except Exception as e:
        logger.error(f"Error getting available voices: {str(e)}")
        return []

async def find_valid_vietnamese_voice():
    """Find a valid Vietnamese voice"""
    try:
        voices = await get_available_voices()
        vietnamese_voices = [v for v in voices if v['Locale'].startswith('vi-VN')]
        
        if vietnamese_voices:
            return vietnamese_voices[0]['ShortName']
        else:
            return "vi-VN-HoaiMyNeural"
    except Exception:
        return "vi-VN-HoaiMyNeural"

async def generate_speech(text, voice="vi-VN-HoaiMyNeural"):
    """Generate speech audio from text using Edge TTS"""
    try:
        # Validate and correct voice name if needed
        voices = await get_available_voices()
        available_voice_names = [v['ShortName'] for v in voices]
        
        if voice not in available_voice_names:
            valid_voice = await find_valid_vietnamese_voice()
            voice = valid_voice
        
        communicate = edge_tts.Communicate(text, voice)
        audio_data = b""
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        if len(audio_data) == 0:
            raise Exception("No audio data received")
            
        return audio_data
        
    except Exception as e:
        logger.error(f"Error in generate_speech: {str(e)}")
        raise e

@app.route('/tts', methods=['POST', 'OPTIONS'])
def tts():
    """Text-to-Speech endpoint"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response
    
    try:
        data = request.get_json()
        if not data:
            return {"error": "No JSON data provided"}, 400
            
        text = data.get('text', '')
        voice = data.get('voice', 'vi-VN-HoaiMyNeural')
        
        if not text:
            return {"error": "No text provided"}, 400
        
        # Generate speech
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio_data = loop.run_until_complete(generate_speech(text, voice))
        
        # Create response
        response = make_response(audio_data)
        response.headers.set('Content-Type', 'audio/mpeg')
        response.headers.set('Content-Disposition', 'attachment; filename=speech.mp3')
        return response
        
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        return {"error": "TTS generation failed"}, 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Edge TTS Server"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)