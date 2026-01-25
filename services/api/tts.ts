import axios from 'axios';
import { Buffer } from 'buffer';

// @ts-ignore: Temporary fix for Expo FileSystem types
const FileSystem = require('expo-file-system/legacy');

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
// User configurable Voice ID, defaults to a standard one if not set
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export const TTSService = {
    generateAudio: async (text: string): Promise<string | null> => {
        if (!ELEVENLABS_API_KEY) {
            console.error('Missing ElevenLabs API Key');
            return null;
        }

        try {
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
                {
                    text: text,
                    model_id: "eleven_v3",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    }
                },
                {
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer', // Important for binary data
                }
            );

            // Save to temporary file
            const path = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
            // Convert ArrayBuffer to Base64
            const base64 = Buffer.from(response.data, 'binary').toString('base64');

            await FileSystem.writeAsStringAsync(path, base64, {
                encoding: 'base64',
            });

            return path;
        } catch (error) {
            console.error('TTS Error:', error);
            return null;
        }
    },
};
