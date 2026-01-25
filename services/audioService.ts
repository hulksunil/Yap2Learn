import { Audio } from 'expo-av';

export const AudioService = {
    recording: null as Audio.Recording | null,

    requestPermissions: async () => {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
    },

    startRecording: async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            AudioService.recording = recording;
            return recording;
        } catch (err) {
            console.error('Failed to start recording', err);
            return null;
        }
    },

    stopRecording: async () => {
        try {
            const recording = AudioService.recording;
            if (!recording) return null;

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            AudioService.recording = null;

            // Reset mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            return uri;
        } catch (err) {
            console.error('Failed to stop recording', err);
            return null;
        }
    },
};
