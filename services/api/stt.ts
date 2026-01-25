// @ts-ignore: Temporary fix for Expo FileSystem types
const FileSystem = require('expo-file-system/legacy');

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

export const STTService = {
    transcribe: async (audioUri: string): Promise<string | null> => {
        if (!ELEVENLABS_API_KEY) {
            console.error('Missing ElevenLabs API Key');
            return "Error: Missing API Key";
        }

        try {
            console.log('Transcribing with FileSystem.uploadAsync:', audioUri);

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
        } catch (error: any) {
            console.error('ElevenLabs STT Exception:', error.message);
            return null;
        }
    },
};
