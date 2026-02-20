import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'padelspot_tutorial_seen:';

export async function getTutorialSeen(userId: string): Promise<boolean> {
  if (!userId) return true;
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${userId}`);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setTutorialSeen(userId: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(`${PREFIX}${userId}`, 'true');
}
