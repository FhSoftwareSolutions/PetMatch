import { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchMatches, type Match, type MatchPet } from '../services/api';
import { currentOwnerId } from '../lib/session';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function otherPet(match: Match, me: string): MatchPet {
  return match.summary.ownerA.ownerId === me ? match.summary.petB : match.summary.petA;
}

/** Lista de matches do usuário. */
export default function MatchesScreen() {
  const navigation = useNavigation<Nav>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const me = currentOwnerId();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMatches(await fetchMatches());
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
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.muted}>Sem matches ainda. Curta pets no feed!</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={matches}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => {
        const pet = otherPet(item, me);
        return (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { matchId: item.id, title: pet.name })}
          >
            {pet.mainPhotoUrl ? (
              <Image source={{ uri: pet.mainPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarEmoji}>🐾</Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.name}>{pet.name ?? 'Pet'}</Text>
              <Text style={styles.muted}>{pet.species}</Text>
            </View>
            <Text style={styles.go}>Conversar →</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFB36B' },
  avatarEmoji: { fontSize: 26 },
  meta: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '600' },
  go: { color: colors.coral, fontWeight: '800' },
  emoji: { fontSize: 56 },
});
