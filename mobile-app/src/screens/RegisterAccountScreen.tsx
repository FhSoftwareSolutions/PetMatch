import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { registerAccount } from '../services/api';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterAccountScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      await registerAccount({ name: name.trim(), email: email.trim(), password });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha no cadastro.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={colors.muted} />
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
        placeholder="Senha (mín. 6)"
        secureTextEntry
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.primaryBtn} onPress={() => void handleSubmit()} disabled={submitting}>
        <Text style={styles.primaryText}>{submitting ? 'Criando…' : 'Criar conta'}</Text>
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
});
