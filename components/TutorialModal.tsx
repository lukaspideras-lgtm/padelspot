import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TutorialModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function TutorialModal({ visible, onDismiss }: TutorialModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          <View style={styles.modalContent}>
            <View style={[styles.iconWrap, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="sparkles-outline" size={48} color={theme.tint} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Dobrodošli u Padel Spot
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Evo kako da koristite aplikaciju:
            </Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled">
            <View style={styles.step}>
              <Ionicons name="calendar-outline" size={22} color={theme.tint} style={styles.stepIcon} />
              <Text style={[styles.stepText, { color: theme.text }]}>
                <Text style={styles.bold}>Rezerviši</Text> – izaberite datum, teren i trajanje. Prikazuju se samo slobodni termini.
              </Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="list-outline" size={22} color={theme.tint} style={styles.stepIcon} />
              <Text style={[styles.stepText, { color: theme.text }]}>
                <Text style={styles.bold}>Istorija</Text> – vaše rezervacije. Možete otkazati termin (do 2h pre početka) ili dodati u kalendar.
              </Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="card-outline" size={22} color={theme.tint} style={styles.stepIcon} />
              <Text style={[styles.stepText, { color: theme.text }]}>
                <Text style={styles.bold}>Cenovnik</Text> – cene po satima i danima.
              </Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="person-outline" size={22} color={theme.tint} style={styles.stepIcon} />
              <Text style={[styles.stepText, { color: theme.text }]}>
                <Text style={styles.bold}>Profil</Text> – kalendar, postavke, pomoć.
              </Text>
            </View>
          </ScrollView>
            <PrimaryButton
              title="Kreni"
              onPress={onDismiss}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'stretch',
    height: '85%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    flex: 1,
    minHeight: 0,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.headline,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  scroll: { flex: 1, minHeight: 0, marginBottom: 20 },
  scrollContent: { padding: 16, paddingBottom: 48, flexGrow: 1 },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepIcon: { marginRight: 12, marginTop: 2 },
  stepText: { flex: 1, ...typography.body, fontSize: 15, lineHeight: 22 },
  bold: { fontFamily: 'Montserrat-SemiBold' },
  btn: {},
});
