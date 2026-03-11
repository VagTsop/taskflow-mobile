import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';

export default function RegisterScreen({ navigation }: any) {
  const theme = useTheme();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('All fields required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        </View>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.cardTitle}>Create Account</Text>

          {error ? <HelperText type="error" visible>{error}</HelperText> : null}

          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
          />
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

          <Button mode="contained" onPress={handleRegister} loading={loading} disabled={loading} style={styles.button} contentStyle={styles.buttonContent}>
            Create Account
          </Button>

          <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.link}>
            Already have an account? Sign In
          </Button>
        </Surface>
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
});
