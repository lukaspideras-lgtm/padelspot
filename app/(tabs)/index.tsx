// Redirect to reserve tab - tab bar defaults to first visible tab
import { Redirect } from 'expo-router';

export default function TabIndex() {
  return <Redirect href="/(tabs)/reserve" />;
}
