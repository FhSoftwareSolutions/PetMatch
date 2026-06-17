import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SwipeScreen from '../screens/SwipeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterAccountScreen from '../screens/RegisterAccountScreen';
import RegisterPetScreen from '../screens/RegisterPetScreen';
import { colors } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.ink },
      }}
    >
      <Tab.Screen
        name="Descobrir"
        component={SwipeScreen}
        options={{ title: '🐾 PetMatch', tabBarIcon: () => <Text style={{ fontSize: 18 }}>🐾</Text> }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>💬</Text> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

/** Stack raiz: as abas + telas empilhadas (chat, login, cadastros). */
export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.ink },
        headerTintColor: colors.coral,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.title ?? 'Conversa' })}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
      <Stack.Screen
        name="RegisterAccount"
        component={RegisterAccountScreen}
        options={{ title: 'Criar conta' }}
      />
      <Stack.Screen
        name="RegisterPet"
        component={RegisterPetScreen}
        options={{ title: 'Cadastrar pet' }}
      />
    </Stack.Navigator>
  );
}
