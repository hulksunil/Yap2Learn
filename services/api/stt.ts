import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

export const STTService = {
    transcribe: async (audioUri: string): Promise<string | null> => {
        if (!ELEVENLABS_API_KEY) {
            console.error('Missing ElevenLabs API Key');
            return "Error: Missing API Key";
        }

        try {
            console.log('Transcribing audio:', audioUri);

            if (Platform.OS === 'web') {
                // Web Implementation
                const response = await fetch(audioUri);
                const blob = await response.blob();

                const formData = new FormData();
                formData.append('file', blob, 'recording.webm');
                formData.append('model_id', 'scribe_v2');

                const sttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                    method: 'POST',
                    headers: {
                        'xi-api-key': ELEVENLABS_API_KEY.trim(),
                        'Accept': 'application/json',
                    },
                    body: formData,
                });

                if (!sttResponse.ok) {
                    const errText = await sttResponse.text();
                    console.error('ElevenLabs STT Error (Web):', errText);
                    return null;
                }

                const data = await sttResponse.json();
                return data.text;

            } else {
                // Native Implementation (iOS/Android)
                const response = await FileSystem.uploadAsync(
                    'https://api.elevenlabs.io/v1/speech-to-text',
                    audioUri,
                    {
                        fieldName: 'file',
                        httpMethod: 'POST',
                        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                        headers: {
                            'xi-api-key': ELEVENLABS_API_KEY.trim(),
                            'Accept': 'application/json',
                        },
                        parameters: {
                            'model_id': 'scribe_v2',
                        },
                    }
                );

                console.log('STT Response Status:', response.status);

                if (response.status !== 200) {
                    console.error('ElevenLabs STT Error:', response.body);
                    return null;
                }

                const data = JSON.parse(response.body);
                return data.text;
            }
        } catch (error: any) {
            console.error('ElevenLabs STT Exception:', error.message);
            return null;
        }
    },
};
