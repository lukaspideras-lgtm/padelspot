import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

interface DatePickerButtonProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

function formatDateISO(d: Date) {
  return d.toISOString().split('T')[0];
}

export function DatePickerButton({
  value,
  onChange,
  minimumDate = new Date(),
}: DatePickerButtonProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState(formatDateISO(value));

  useEffect(() => {
    if (showPicker) setWebDateInput(formatDateISO(value));
  }, [showPicker, value]);

  const handleNativeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) onChange(date);
  };

  const handleWebSubmit = () => {
    const parsed = new Date(webDateInput);
    if (!isNaN(parsed.getTime())) {
      onChange(parsed);
    }
    setShowPicker(false);
  };

  if (Platform.OS === 'web') {
    return (
      <>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.text, { color: theme.text }]}>
            {value.toLocaleDateString('sr-Latn-RS', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
        {showPicker && (
          <Modal transparent animationType="slide">
            <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
              <Pressable
                style={[styles.modalContent, { backgroundColor: theme.surface }]}
                onPress={(e) => e.stopPropagation()}>
                <Text style={[styles.label, { color: theme.text }]}>Unesite datum (GGGG-MM-DD)</Text>
                <TextInput
                  value={webDateInput}
                  onChangeText={setWebDateInput}
                  placeholder="2026-02-15"
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholderTextColor={theme.textSecondary}
                />
                <View style={styles.row}>
                  <PrimaryButton title="Odustani" variant="outline" onPress={() => setShowPicker(false)} style={styles.btn} />
                  <PrimaryButton title="Potvrdi" onPress={handleWebSubmit} style={styles.btn} />
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.text, { color: theme.text }]}>
          {value.toLocaleDateString('sr-Latn-RS', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </Pressable>
      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.surface }]}
              onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                onChange={handleNativeChange}
                minimumDate={minimumDate}
              />
              <PrimaryButton title="Zatvori" onPress={() => setShowPicker(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleNativeChange}
          minimumDate={minimumDate}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: { padding: 16, borderRadius: 12, borderWidth: 1 },
  text: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  btn: { flex: 1 },
});
