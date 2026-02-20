// =============================================================================
// Persist storage - SecureStore na mobilnom, AsyncStorage na webu
// TODO: Kasnije možda koristiti samo SecureStore kada se deploya samo na mobilni
// =============================================================================

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const secureStoreAvailable = Platform.OS !== 'web';

export async function setItem(key: string, value: string): Promise<void> {
  if (secureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (secureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function removeItem(key: string): Promise<void> {
  if (secureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}
