import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandHeader } from '@/components/headers';
import { CalendarPromptModal } from '@/components/CalendarPromptModal';
import { TutorialModal } from '@/components/TutorialModal';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import {
  getCalendarSettings,
  setCalendarEnabled,
  setCalendarPromptSeen,
  ensureCalendarPermission,
} from '@/src/services/calendar';
import { setProfileHasSeenTutorial } from '@/src/services/auth';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const { currentUser, setUser } = useAppStore();
  const { show: showToast } = useToastStore();
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    if (currentUser.hasSeenTutorial === false) {
      setShowTutorial(true);
      return;
    }
    getCalendarSettings(currentUser.email).then((calSettings) => {
      if (!calSettings.calendarPromptSeen) setShowCalendarPrompt(true);
    });
  }, [currentUser?.email, currentUser?.hasSeenTutorial]);

  const handleTutorialDismiss = async () => {
    if (currentUser) {
      try {
        await setProfileHasSeenTutorial();
        setUser({ ...currentUser, hasSeenTutorial: true });
      } catch (e: any) {
        showToast('Ne mogu da sačuvam da je tutorijal završen. Pokušajte ponovo.', 'error');
        return;
      }
      const s = await getCalendarSettings(currentUser.email);
      if (!s.calendarPromptSeen) setShowCalendarPrompt(true);
    }
    setShowTutorial(false);
  };

  const handleCalendarNotNow = async () => {
    if (currentUser?.email) {
      await setCalendarEnabled(currentUser.email, false);
      await setCalendarPromptSeen(currentUser.email, true);
    }
    setShowCalendarPrompt(false);
  };

  const handleCalendarAllow = async () => {
    if (!currentUser?.email) {
      setShowCalendarPrompt(false);
      return;
    }
    const granted = await ensureCalendarPermission();
    await setCalendarEnabled(currentUser.email, granted);
    await setCalendarPromptSeen(currentUser.email, true);
    setShowCalendarPrompt(false);
    if (!granted) {
      showToast('Dozvola za kalendar nije odobrena.', 'error');
    }
  };

  return (
    <>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface },
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        header: () => <BrandHeader />,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="reserve"
        options={{
          title: 'Rezerviši',
          tabBarLabel: 'Rezerviši',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-reservations"
        options={{
          title: 'Istorija',
          tabBarLabel: 'Istorija',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cenovnik"
        options={{
          title: 'Cenovnik',
          tabBarLabel: 'Cenovnik',
          tabBarIcon: ({ color }) => <TabBarIcon name="card-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>

    <TutorialModal visible={showTutorial} onDismiss={handleTutorialDismiss} />
    <CalendarPromptModal
      visible={showCalendarPrompt}
      onDismiss={handleCalendarNotNow}
      onAllow={handleCalendarAllow}
      onNotNow={handleCalendarNotNow}
    />
    </>
  );
}
