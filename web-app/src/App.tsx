import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import SwipePage from './pages/SwipePage';
import MatchesPage from './pages/MatchesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterAccountPage from './pages/RegisterAccountPage';
import RegisterPetPage from './pages/RegisterPetPage';
import { setMyPet } from './lib/session';
import type { Pet } from './services/api';

/** Rota de cadastro de pet (reusa o formulário do onboarding). */
function NewPetRoute() {
  const navigate = useNavigate();
  function handleDone(pet: Pet) {
    setMyPet(pet);
    navigate('/');
  }
  return <RegisterPetPage isOnboarding={false} onDone={handleDone} onCancel={() => navigate(-1)} />;
}

/**
 * Raiz do app web. Roteamento por react-router: feed de swipe, matches, chat,
 * perfil e telas de conta. O onboarding (1º cadastro de pet) vive no SwipePage.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SwipePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<ChatPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterAccountPage />} />
        <Route path="/pets/novo" element={<NewPetRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
