import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'padelspot_hidden_cancelled_reservation_ids';

export async function getHiddenCancelledIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function addHiddenCancelledId(id: string): Promise<void> {
  const ids = await getHiddenCancelledIds();
  if (ids.includes(id)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...ids, id]));
}

export async function clearHiddenCancelledIds(): Promise<void> {
  await AsyncStorage.setItem(KEY, '[]');
}
