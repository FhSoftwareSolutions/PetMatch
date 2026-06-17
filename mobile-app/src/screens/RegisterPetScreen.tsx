import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { createPet, type Gender, type Seeking, type Size } from '../services/api';
import { setMyPet } from '../lib/session';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
];
const SIZES: { value: Size; label: string }[] = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
];
const SEEKINGS: { value: Seeking; label: string }[] = [
  { value: 'socializacao', label: 'Socializar' },
  { value: 'cruzamento', label: 'Cruzamento' },
  { value: 'ambos', label: 'Ambos' },
];

/** Linha de "chips" para escolher um valor de uma lista. */
function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={[styles.chip, value === o.value && styles.chipActive]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[styles.chipText, value === o.value && styles.chipTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function RegisterPetScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Cão');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<Gender>('macho');
  const [ageMonths, setAgeMonths] = useState('');
  const [size, setSize] = useState<Size>('medio');
  const [seeking, setSeeking] = useState<Seeking>('socializacao');
  const [city, setCity] = useState('São Paulo');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const months = Number(ageMonths);
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome do pet.');
    if (!ageMonths || Number.isNaN(months) || months < 0) {
      return Alert.alert('Atenção', 'Informe a idade em meses.');
    }
    setSubmitting(true);
    try {
      const pet = await createPet({
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        gender,
        ageMonths: Math.round(months),
        size,
        seeking,
        city,
        bio: bio.trim() || undefined,
      });
      await setMyPet({ id: pet.id, name: pet.name });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cadastrar pet</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex.: Thor" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Espécie</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Raça (opcional)</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Ex.: Labrador" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Sexo</Text>
      <Chips options={GENDERS} value={gender} onChange={setGender} />

      <Text style={styles.label}>Idade (meses)</Text>
      <TextInput
        style={styles.input}
        value={ageMonths}
        onChangeText={setAgeMonths}
        keyboardType="number-pad"
        placeholder="Ex.: 24"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Porte</Text>
      <Chips options={SIZES} value={size} onChange={setSize} />

      <Text style={styles.label}>Procura por</Text>
      <Chips options={SEEKINGS} value={seeking} onChange={setSeeking} />

      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Bio (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Conte sobre o pet…"
        placeholderTextColor={colors.muted}
      />

      <Pressable style={styles.primaryBtn} onPress={() => void handleSubmit()} disabled={submitting}>
        <Text style={styles.primaryText}>{submitting ? 'Salvando…' : 'Cadastrar pet'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  label: { fontWeight: '800', color: colors.ink, marginTop: 8 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 2, borderColor: colors.border, color: colors.ink },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  chipText: { fontWeight: '700', color: colors.muted },
  chipTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: colors.coral, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
