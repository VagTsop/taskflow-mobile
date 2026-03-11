import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Button, Divider, Switch, List, Avatar, Dialog, Portal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

const AVATAR_COLORS = ['#1976d2','#9c27b0','#2e7d32','#ff9800','#d32f2f','#0288d1','#7b1fa2','#00897b','#5c6bc0','#f44336'];

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, logout, updateUser } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatar_color || '#1976d2');
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateMe({ name, avatar_color: selectedColor });
      updateUser(updated);
      setShowProfile(false);
    } catch {}
    setSaving(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Profile Card */}
      <Surface style={styles.profileCard} elevation={1}>
        <View style={[styles.avatar, { backgroundColor: user?.avatar_color || theme.colors.primary }]}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text variant="titleLarge" style={styles.name}>{user?.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{user?.email}</Text>
        <Button mode="outlined" onPress={() => setShowProfile(true)} style={{ marginTop: 12 }} icon="pencil" compact>
          Edit Profile
        </Button>
      </Surface>

      {/* App Info */}
      <Surface style={styles.section} elevation={1}>
        <List.Item
          title="About TaskFlow"
          description="Task management & productivity app"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <Divider />
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="tag" />}
        />
        <Divider />
        <List.Item
          title="Built with"
          description="React Native + Expo + Express"
          left={(props) => <List.Icon {...props} icon="code-braces" />}
        />
      </Surface>

      {/* Logout */}
      <Button mode="contained" buttonColor="#d32f2f" onPress={() => setShowLogout(true)} style={styles.logoutBtn} icon="logout">
        Sign Out
      </Button>

      <Text variant="labelSmall" style={styles.footer}>Portfolio project by TaskFlow</Text>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={showProfile} onDismiss={() => setShowProfile(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <Text variant="labelMedium" style={{ marginBottom: 8, marginTop: 4 }}>Avatar Color</Text>
            <View style={styles.colorPicker}>
              {AVATAR_COLORS.map((c) => (
                <View key={c} style={[styles.colorOption, { backgroundColor: c }, selectedColor === c ? styles.colorSelected : undefined]}
                  onTouchEnd={() => setSelectedColor(c)} />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowProfile(false)}>Cancel</Button>
            <Button onPress={handleSaveProfile} loading={saving}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showLogout} onDismiss={() => setShowLogout(false)}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogout(false)}>Cancel</Button>
            <Button textColor="#d32f2f" onPress={logout}>Sign Out</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  profileCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontSize: 28, fontWeight: '700' },
  name: { fontWeight: '700' },
  section: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  logoutBtn: { marginTop: 8, borderRadius: 8 },
  footer: { textAlign: 'center', opacity: 0.4, marginTop: 24, marginBottom: 16 },
  input: { marginBottom: 12 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: 'white', elevation: 4 },
});
