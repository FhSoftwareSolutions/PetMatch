import { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchMyPets, deletePet, type Pet } from '../services/api';
import { getAccount, clearSession, getMyPet, clearMyPet, type Account } from '../lib/session';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Perfil: conta (entrar/sair) e gestão dos pets do usuário. */
export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [account, setAccount] = useState<Account | null>(getAccount());
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setAccount(getAccount());
    try {
      setPets(await fetchMyPets());
    } catch {
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function logout() {
    await clearSession();
    setAccount(null);
  }

  function confirmDelete(pet: Pet) {
    Alert.alert('Excluir', `Excluir ${pet.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePet(pet.id);
              if (getMyPet()?.id === pet.id) await clearMyPet();
              setPets((list) => list.filter((p) => p.id !== pet.id));
            } catch {
              /* ignore */
            }
          })();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.accountCard}>
        {account ? (
          <>
            <Text style={styles.name}>{account.name}</Text>
            <Text style={styles.muted}>{account.email}</Text>
            <Pressable style={styles.ghostBtn} onPress={() => void logout()}>
              <Text style={styles.ghostText}>Sair</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.muted}>Você está navegando sem conta.</Text>
            <View style={styles.authRow}>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.primaryText}>Entrar</Text>
              </Pressable>
              <Pressable
                style={styles.ghostBtn}
                onPress={() => navigation.navigate('RegisterAccount')}
              >
                <Text style={styles.ghostText}>Criar conta</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Meus pets</Text>
        <Pressable style={styles.pill} onPress={() => navigation.navigate('RegisterPet')}>
          <Text style={styles.pillText}>+ Novo</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={pets}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={
          !loading ? <Text style={styles.muted}>Você ainda não cadastrou pets.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.mainPhotoUrl ? (
              <Image source={{ uri: item.mainPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarEmoji}>🐾</Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.muted}>{item.breed ? `${item.species} • ${item.breed}` : item.species}</Text>
            </View>
            <Pressable onPress={() => confirmDelete(item)}>
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  accountCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, marginBottom: 16 },
  authRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  section: { fontSize: 18, fontWeight: '800', color: colors.ink },
  listContent: { gap: 10, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB36B' },
  avatarEmoji: { fontSize: 24 },
  meta: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600' },
  delete: { fontSize: 22 },
  primaryBtn: { backgroundColor: colors.coral, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14 },
  primaryText: { color: '#fff', fontWeight: '800' },
  ghostBtn: { borderWidth: 2, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#fff' },
  ghostText: { color: colors.muted, fontWeight: '800' },
  pill: { backgroundColor: colors.coral, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  pillText: { color: '#fff', fontWeight: '800' },
});
