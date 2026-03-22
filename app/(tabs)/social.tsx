// filepath: app/(tabs)/social.tsx
import React, { useState, useCallback, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

// Lazy load screens to avoid circular deps
const Feed = React.lazy(() => import('../social/feed'));
const Messages = React.lazy(() => import('../social/messages'));
const Explore = React.lazy(() => import('../social/explore'));
const Notifications = React.lazy(() => import('../social/notifications'));
const Profile = React.lazy(() => import('../social/profile'));

type TabId = 'feed' | 'messages' | 'explore' | 'notifications' | 'profile';

const TABS = [
  { id: 'feed', label: 'Feed', icon: 'home' as const },
  { id: 'messages', label: 'Messages', icon: 'message-text' as const },
  { id: 'explore', label: 'Explore', icon: 'compass' as const },
  { id: 'notifications', label: 'Alerts', icon: 'bell' as const },
  { id: 'profile', label: 'Profile', icon: 'account' as const }
];

export default function SocialHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('feed');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'messages':
        return <Messages />;
      case 'explore':
        return <Explore />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <TouchableOpacity style={styles.qrBtn} onPress={() => router.push('/social/my-qr' as any)}>
          <MaterialCommunityIcons name="qrcode-scan" size={22} color={Colors.dark.lime} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? Colors.dark.lime : Colors.dark.muted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <Suspense fallback={<View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={Colors.dark.lime} /></View>}>
          {renderTabContent()}
        </Suspense>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  qrBtn: { padding: 8, backgroundColor: '#111', borderRadius: 12 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8, gap: 4 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'transparent' },
  activeTabItem: { backgroundColor: '#111' },
  tabLabel: { fontSize: 11, color: Colors.dark.muted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  activeTabLabel: { color: Colors.dark.lime }
});
