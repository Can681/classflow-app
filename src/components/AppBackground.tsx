import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSchedule } from '../context/ScheduleContext';
import { WALLPAPER_PRESETS } from '../constants/themes';

export const AppBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, theme } = useSchedule();

  if (settings.wallpaperId === 'custom' && settings.customWallpaperUri) {
    return (
      <ImageBackground
        source={{ uri: settings.customWallpaperUri }}
        style={styles.fill}
        resizeMode="cover"
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.isDark
                ? 'rgba(10, 14, 24, 0.56)'
                : 'rgba(255, 255, 255, 0.32)',
            },
          ]}
        >
          {children}
        </View>
      </ImageBackground>
    );
  }

  const preset =
    WALLPAPER_PRESETS.find((p) => p.id === settings.wallpaperId) || WALLPAPER_PRESETS[0];
  const colors = theme.isDark ? preset.darkColors : preset.lightColors;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
