import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('All fields required'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (e: string) => {
    setLoading(true);
    setError('');
    try {
      await login(e, 'password123');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={theme.colors.primary} />
          <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>TaskFlow</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Organize. Prioritize. Achieve.</Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.cardTitle}>Welcome Back</Text>

          {error ? <HelperText type="error" visible>{error}</HelperText> : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
            style={styles.input}
          />

          <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={styles.button} contentStyle={styles.buttonContent}>
            Sign In
          </Button>

          <Button mode="text" onPress={() => navigation.navigate('Register')} style={styles.link}>
            Don't have an account? Sign Up
          </Button>
        </Surface>

        <Text variant="labelMedium" style={styles.demoLabel}>Quick Demo Access</Text>
        <View style={styles.demoRow}>
          <Button mode="outlined" onPress={() => quickLogin('alex@demo.com')} compact style={styles.demoBtn} icon="account">
            Alex
          </Button>
          <Button mode="outlined" onPress={() => quickLogin('sarah@demo.com')} compact style={styles.demoBtn} icon="account">
            Sarah
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontWeight: '700', marginTop: 8 },
  card: { padding: 24, borderRadius: 16 },
  cardTitle: { fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: { marginBottom: 12 },
  button: { marginTop: 8, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  link: { marginTop: 8 },
  demoLabel: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
  demoRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  demoBtn: { flex: 1 },
});
