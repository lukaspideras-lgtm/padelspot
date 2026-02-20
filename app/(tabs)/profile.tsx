import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Switch, StyleSheet, Pressable, Modal } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { ProfileCard } from '@/components/ProfileCard';
import { KontaktCard } from '@/components/KontaktCard';
import { MapPreviewCard } from '@/components/MapPreviewCard';
import { PrimaryButton, ScreenGradient } from '@/components/ui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { clearHiddenCancelledIds } from '@/utils/hiddenCancelled';
import { supabase } from '@/src/lib/supabase';
import {
  getCalendarSettings,
  setCalendarEnabled,
  ensureCalendarPermission,
} from '@/src/services/calendar';

export default function ProfileScreen() {
  const { currentUser, setUser } = useAppStore();
  const { show: showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();
  const themeColors = useTheme();
  const isAdmin = currentUser?.role === 'admin';
  const [calendarEnabled, setCalendarEnabledState] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser?.email) {
        getCalendarSettings(currentUser.email).then((s) =>
          setCalendarEnabledState(s.calendarEnabled)
        );
      }
    }, [currentUser?.email])
  );

  const handleCalendarToggle = async (value: boolean) => {
    if (!currentUser?.email) return;
    if (value) {
      const granted = await ensureCalendarPermission();
      if (granted) {
        await setCalendarEnabled(currentUser.email, true);
        setCalendarEnabledState(true);
      } else {
        showToast('Dozvola za kalendar nije odobrena.', 'error');
        setCalendarEnabledState(false);
      }
    } else {
      await setCalendarEnabled(currentUser.email, false);
      setCalendarEnabledState(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setUser(null);
    } catch {
      showToast('Greška pri odjavi. Pokušajte ponovo.', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleResetHiddenCancelled = async () => {
    await clearHiddenCancelledIds();
    showToast('Obrisani otkazani termini će se ponovo prikazati u istoriji.', 'success');
  };

  if (!currentUser) return null;

  return (
    <ScreenGradient>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <ProfileCard user={currentUser} />

          <Pressable
            onPress={() => setShowHelpModal(true)}
            style={[styles.helpRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Ionicons name="help-circle-outline" size={24} color={themeColors.tint} style={styles.helpIcon} />
            <Text style={[styles.helpRowLabel, { color: themeColors.text }]}>Pomoć</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <KontaktCard />
          <MapPreviewCard />

          {isAdmin && (
            <Pressable
              onPress={() => router.push('/admin')}
              style={[styles.adminLink, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.adminLinkText, { color: themeColors.tint }]}>
                Admin panel
              </Text>
            </Pressable>
          )}

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}>
            <Text
              style={[styles.toggleLabel, { color: themeColors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail">
              Automatski dodaj termine u kalendar
            </Text>
            <Switch
              value={calendarEnabled}
              onValueChange={handleCalendarToggle}
              trackColor={{ false: themeColors.border, true: themeColors.tint }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            onPress={handleResetHiddenCancelled}
            style={[styles.resetRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.resetLabel, { color: themeColors.textSecondary }]}>
              Resetuj obrisane otkazane termine
            </Text>
          </Pressable>

          <View
            style={[
              styles.toggleRow,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}>
            <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
              Tamni režim
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: themeColors.border, true: themeColors.tint }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title="Odjavi se"
            onPress={() => handleLogout()}
            loading={isLoggingOut}
            disabled={isLoggingOut}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.logoutBtn}
          />
        </View>
      </View>

      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}>
        <View style={[styles.helpOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHelpModal(false)}
          />
          <View style={[styles.helpModal, { backgroundColor: themeColors.surface }]}>
            <View style={styles.helpModalContent}>
              <Text style={[styles.helpTitle, { color: themeColors.text }]}>Pomoć – Padel Spot</Text>
              <ScrollView
                style={styles.helpScroll}
                contentContainerStyle={styles.helpScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled">
              <Text style={[styles.helpSection, { color: themeColors.text }]}>Rezerviši</Text>
              <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
                Izaberite datum, teren i trajanje (1h ili 2h). Prikazuju se samo slobodni termini. Izaberite termin i potvrdite rezervaciju. Možete dodati reket uz doplatu.
              </Text>
              <Text style={[styles.helpSection, { color: themeColors.text }]}>Istorija</Text>
              <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
                Pregled vaših rezervacija. Tabovi: Predstojeći, Završeni, Otkazani. Za predstojeće možete otkazati termin (najkasnije 2h pre početka) ili dodati termin u kalendar. Otkazane rezervacije možete obrisati iz liste („Obriši“) – ostaju u evidenciji, ali se više ne prikazuju.
              </Text>
              <Text style={[styles.helpSection, { color: themeColors.text }]}>Cenovnik</Text>
              <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
                Cene po satima i danima u nedelji. Vikend i praznici imaju drugačije cene.
              </Text>
              <Text style={[styles.helpSection, { color: themeColors.text }]}>Profil</Text>
              <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
                Automatski dodaj termine u kalendar – uključivanjem, vaše nove rezervacije se dodaju u kalendar sa podsetnicama (24h i 2h pre). Resetuj obrisane otkazane termine – prikazuje ponovo obrisane otkazane termine u Istoriji. Tamni režim – prekidač za tamnu ili svetlu temu.
              </Text>
              <Text style={[styles.helpSection, { color: themeColors.text }]}>Kontakt i lokacija</Text>
              <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
                Kontakt informacije i dugme za otvaranje lokacije na mapama.
              </Text>
              </ScrollView>
              <PrimaryButton
                title="Zatvori"
                onPress={() => setShowHelpModal(false)}
                style={styles.helpCloseBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  // Extra padding so content never hides behind footer button.
  container: { padding: 20, paddingBottom: 140 },
  adminLink: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  adminLinkText: { ...typography.button },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  resetLabel: { ...typography.body },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  toggleLabel: { ...typography.subtitle, flex: 1, marginRight: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  logoutBtn: { alignSelf: 'stretch' },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  helpIcon: { marginRight: 12 },
  helpRowLabel: { ...typography.subtitle, flex: 1 },
  helpOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  helpModal: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'stretch',
    height: '80%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  helpModalContent: { flex: 1, minHeight: 0 },
  helpTitle: { ...typography.title, marginBottom: 16, textAlign: 'center' },
  helpScroll: { flex: 1, minHeight: 0, marginBottom: 16 },
  helpScrollContent: { padding: 16, paddingBottom: 48, flexGrow: 1 },
  helpSection: { ...typography.subtitle, marginTop: 12, marginBottom: 4 },
  helpText: { ...typography.body, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  helpCloseBtn: { marginTop: 4 },
});
