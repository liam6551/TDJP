import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const STORAGE_KEY = 'TDJP_ROOT_URI';
const IOS_FOLDER_NAME = 'TDJP';

export const getStoredUri = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEY);
};

export const setStoredUri = async (uri: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, uri);
};

export const requestAndroidPermissions = async (): Promise<string | null> => {
    if (Platform.OS !== 'android') return null;

    const fsAny = FileSystemLegacy as any;
    const saf = fsAny.StorageAccessFramework;

    // We try to suggest the Documents folder, but user ultimately picks
    try {
        const permissions = await saf.requestDirectoryPermissionsAsync();
        if (permissions.granted && permissions.directoryUri) {
            return permissions.directoryUri;
        }
    } catch (e) {
        console.warn('SAF Request Failed', e);
    }
    return null;
};

export const saveFileToAppFolder = async (sourceUri: string, fileName: string): Promise<string | null> => {
    try {
        if (Platform.OS === 'ios') {
            // iOS: Simple Copy to Documents/TDJP
            const folderParams = `${(FileSystem as any).documentDirectory}${IOS_FOLDER_NAME}`;

            // Ensure folder exists
            const folderInfo = await FileSystem.getInfoAsync(folderParams);
            if (!folderInfo.exists) {
                await FileSystem.makeDirectoryAsync(folderParams, { intermediates: true });
            }

            const destination = `${folderParams}/${fileName}`;
            await FileSystem.copyAsync({ from: sourceUri, to: destination });
            return destination;
        }
        else if (Platform.OS === 'android') {
            // Android: Use SAF
            const directoryUri = await getStoredUri();

            if (!directoryUri) {
                // Should be caught by UI before calling this, but fallback:
                console.warn('No storage permission configured');
                return null;
            }

            const fsAny = FileSystemLegacy as any;
            const saf = fsAny.StorageAccessFramework;

            // Read source content
            const base64 = await fsAny.readAsStringAsync(sourceUri, { encoding: 'base64' });

            // Create file
            const userMime = 'application/pdf'; // Assuming PDF for now, can make generic if needed
            const newUri = await saf.createFileAsync(directoryUri, fileName, userMime);

            // Write content
            await fsAny.writeAsStringAsync(newUri, base64, { encoding: 'base64' });

            return newUri;
        }
    } catch (e) {
        console.error('Global Save Failed', e);
        // If Android permission revoked, we might need to handle clear AsyncStorage here or let UI handle it
    }
    return null;
};
