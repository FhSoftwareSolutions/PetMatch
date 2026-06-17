import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { fetchMessages, sendMessage, type Message } from '../services/api';
import { currentOwnerId } from '../lib/session';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

/** Conversa de um match (mensagens + envio). */
export default function ChatScreen({ route }: Props) {
  const { matchId } = route.params;
  const me = currentOwnerId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      setMessages(await fetchMessages(matchId));
    } catch {
      /* mantém vazio em erro */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function handleSend() {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const msg = await sendMessage(matchId, value);
      setMessages((m) => [...m, msg]);
      setText('');
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.coral} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={<Text style={styles.muted}>Diga olá! 👋</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.senderId === me ? styles.me : styles.them]}>
              <Text style={item.senderId === me ? styles.meText : styles.themText}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escreva uma mensagem…"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={() => void handleSend()}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { padding: 14, gap: 8 },
  muted: { color: colors.muted, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 16, marginBottom: 8 },
  me: { alignSelf: 'flex-end', backgroundColor: colors.coral },
  them: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  meText: { color: '#fff', fontWeight: '600' },
  themText: { color: colors.ink, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, color: colors.ink },
  send: { backgroundColor: colors.coral, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '800' },
});
