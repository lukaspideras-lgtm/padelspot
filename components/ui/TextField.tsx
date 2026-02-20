import React, { useState } from 'react';
import { typography } from '@/src/theme/typography';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export function TextField({
  label,
  error,
  containerStyle,
  secureTextEntry,
  ...props
}: TextFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.error : isFocused ? theme.tint : theme.border,
            borderWidth: 1,
          },
        ]}>
        <TextInput
          {...props}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !showPassword}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}>
            <Text style={[styles.eyeButtonText, { color: theme.textSecondary }]}>
              {showPassword ? 'Sakrij' : 'Prikaži'}
            </Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...typography.body,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    ...typography.body,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeButtonText: {
    ...typography.body,
  },
  error: {
    ...typography.caption,
    marginTop: 4,
  },
});
