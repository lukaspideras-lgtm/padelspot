import React from 'react';
import { typography } from '@/src/theme/typography';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';

const MAPS_URL = 'https://maps.app.goo.gl/mNKmuUtQcqia2bsR8';

export function MapPreviewCard() {
  const theme = useTheme();

  const openMaps = () => Linking.openURL(MAPS_URL);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text
        style={[
          styles.title,
          { color: theme.textSecondary },
        ]}>
        MAPA
      </Text>
      <Pressable
        onPress={openMaps}
        style={({ pressed }) => [
          styles.mapWrap,
          { opacity: pressed ? 0.92 : 1 },
        ]}>
        <Image
          source={require('@/assets/map_preview.png')}
          style={styles.mapImage}
          resizeMode="cover"
        />
        {/* Dark overlay */}
        <View style={styles.darkOverlay} pointerEvents="none" />
        {/* Bottom gradient fade */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
          pointerEvents="none"
        />
        {/* Bottom-left label */}
        <Text style={styles.label} pointerEvents="none">
          Padel Spot
        </Text>
        {/* Right button overlay */}
        <View style={styles.buttonOverlay} pointerEvents="none">
          <Ionicons name="map-outline" size={14} color="#fff" />
          <Text style={styles.buttonOverlayText}>Otvori u mapama</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...typography.overline,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  mapWrap: {
    height: 200,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  label: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    ...typography.title,
    fontSize: 17,
    color: '#fff',
  },
  buttonOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonOverlayText: {
    ...typography.subtitle,
    fontSize: 13,
    color: '#fff',
  },
});
