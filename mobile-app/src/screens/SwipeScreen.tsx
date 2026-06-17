import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchFeed, fetchPets, recordSwipe, type Pet } from '../services/api';
import { getMyPet } from '../lib/session';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatAge(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/** Feed de descoberta: mostra o pet do topo com botões curtir/passar. */
export default function SwipeScreen() {
  const navigation = useNavigation<Nav>();
  const [deck, setDeck] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const myPet = getMyPet();
      const pets = myPet ? await fetchFeed(myPet.id) : await fetchPets();
      setDeck(pets);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function swipe(type: 'like' | 'dislike') {
    const pet = deck[0];
    if (!pet) return;
    setDeck((d) => d.slice(1));
    const myPet = getMyPet();
    if (!myPet) return;
    try {
      const res = await recordSwipe(myPet.id, pet.id, type);
      if (type === 'like' && res.matched && res.matchId) {
        navigation.navigate('Chat', { matchId: res.matchId, title: pet.name });
      }
    } catch {
      /* best-effort */
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>😿</Text>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void load()}>
          <Text style={styles.primaryBtnText}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const pet = deck[0];
  if (!pet) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🦴</Text>
        <Text style={styles.title}>Por enquanto é só!</Text>
        <Text style={styles.muted}>Cadastre um pet ou recarregue mais tarde.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('RegisterPet')}>
          <Text style={styles.primaryBtnText}>Cadastrar pet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.cardScroll}>
        <View style={styles.card}>
          {pet.mainPhotoUrl ? (
            <Image source={{ uri: pet.mainPhotoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Text style={styles.photoEmoji}>🐾</Text>
            </View>
          )}
          <View style={styles.info}>
            {typeof pet.score === 'number' && (
              <Text style={styles.score}>❤ {Math.round(pet.score * 100)}% de match</Text>
            )}
            <Text style={styles.name}>
              {pet.name} <Text style={styles.age}>{formatAge(pet.ageMonths)}</Text>
            </Text>
            <Text style={styles.meta}>
              📍 {pet.city ?? 'Brasil'} • {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
            </Text>
            {!!pet.bio && <Text style={styles.bio}>{pet.bio}</Text>}
            {pet.temperament.length > 0 && (
              <View style={styles.tags}>
                {pet.temperament.map((t) => (
                  <Text key={t} style={styles.tag}>
                    {t}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={[styles.fab, styles.nope]} onPress={() => void swipe('dislike')}>
          <Text style={styles.fabText}>✕</Text>
        </Pressable>
        <Pressable style={[styles.fab, styles.like]} onPress={() => void swipe('like')}>
          <Text style={styles.fabText}>♥</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: colors.bg },
  cardScroll: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  photo: { width: '100%', height: 380 },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB36B' },
  photoEmoji: { fontSize: 120 },
  info: { padding: 18 },
  score: { color: colors.coralDeep, fontWeight: '800', marginBottom: 6 },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink },
  age: { fontSize: 18, fontWeight: '600', color: colors.muted },
  meta: { marginTop: 4, fontWeight: '700', color: colors.muted },
  bio: { marginTop: 8, color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { backgroundColor: '#F0E6DC', color: colors.ink, fontWeight: '700', fontSize: 12, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingVertical: 18 },
  fab: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  nope: {},
  like: {},
  fabText: { fontSize: 30 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
  primaryBtn: { marginTop: 8, backgroundColor: colors.coral, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});
