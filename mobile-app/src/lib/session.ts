/**
 * Sessão do app mobile.
 *
 * Persistida em AsyncStorage e mantida em memória para leitura síncrona pelo
 * cliente HTTP. Chame `hydrateSession()` na inicialização do app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Account {
  id: string;
  name: string;
  email: string;
}

export interface MyPet {
  id: string;
  name: string;
}

let ownerId = '';
let token: string | null = null;
let account: Account | null = null;
let myPet: MyPet | null = null;

/** ObjectId-like (24 hex) para identidade anônima do dispositivo. */
function randomHex24(): string {
  let s = '';
  for (let i = 0; i < 24; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

/** Carrega a sessão do disco para a memória (chamar no boot). */
export async function hydrateSession(): Promise<void> {
  const [oid, t, acc, mp] = await Promise.all([
    AsyncStorage.getItem('owner_id'),
    AsyncStorage.getItem('token'),
    AsyncStorage.getItem('account'),
    AsyncStorage.getItem('my_pet'),
  ]);
  ownerId = oid ?? randomHex24();
  if (!oid) await AsyncStorage.setItem('owner_id', ownerId);
  token = t;
  account = acc ? (JSON.parse(acc) as Account) : null;
  myPet = mp ? (JSON.parse(mp) as MyPet) : null;
}

export function getOwnerId(): string {
  return ownerId;
}
export function getToken(): string | null {
  return token;
}
export function getAccount(): Account | null {
  return account;
}
export function currentOwnerId(): string {
  return account?.id ?? ownerId;
}
export function getMyPet(): MyPet | null {
  return myPet;
}

export async function setSession(t: string, a: Account): Promise<void> {
  token = t;
  account = a;
  await AsyncStorage.multiSet([
    ['token', t],
    ['account', JSON.stringify(a)],
  ]);
}

export async function clearSession(): Promise<void> {
  token = null;
  account = null;
  await AsyncStorage.multiRemove(['token', 'account']);
}

export async function setMyPet(p: MyPet): Promise<void> {
  myPet = p;
  await AsyncStorage.setItem('my_pet', JSON.stringify(p));
}

export async function clearMyPet(): Promise<void> {
  myPet = null;
  await AsyncStorage.removeItem('my_pet');
}
