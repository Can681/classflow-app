import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScheduleProvider, useSchedule } from './src/context/ScheduleContext';
import { AppBackground } from './src/components/AppBackground';
import { BottomTabBar } from './src/components/BottomTabBar';
import { TimetableScreen } from './src/screens/TimetableScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { ImportExportScreen } from './src/screens/ImportExportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TabKey } from './src/types/schedule';

const MainApp: React.FC = () => {
  const { theme } = useSchedule();
  const [activeTab, setActiveTab] = useState<TabKey>('timetable');

  return (
    <AppBackground>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.root}>
        {activeTab === 'timetable' && <TimetableScreen />}
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'import' && <ImportExportScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
        <BottomTabBar activeTab={activeTab} onSelect={setActiveTab} />
      </View>
    </AppBackground>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ScheduleProvider>
        <MainApp />
      </ScheduleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
