import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { login } from '../services/api';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha no login.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.primaryBtn} onPress={() => void handleSubmit()} disabled={submitting}>
        <Text style={styles.primaryText}>{submitting ? 'Entrando…' : 'Entrar'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('RegisterAccount')}>
        <Text style={styles.link}>Não tem conta? Criar conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: colors.border, color: colors.ink },
  primaryBtn: { backgroundColor: colors.coral, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: colors.coral, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
