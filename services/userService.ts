import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'yap2learn_user_id';

export const UserService = {
    getUserId: async (): Promise<string> => {
        try {
            const existing = await AsyncStorage.getItem(USER_ID_KEY);
            if (existing) {
                return existing;
            }
            // Generate new
            const newId = uuidv4();
            await AsyncStorage.setItem(USER_ID_KEY, newId);
            return newId;
        } catch (error) {
            console.error('Error getting user ID', error);
            return 'anonymous-fallback';
        }
    }
};
