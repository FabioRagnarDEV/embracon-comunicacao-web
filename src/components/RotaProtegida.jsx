import { Navigate } from 'react-router-dom';

/**
 * Protege rotas privadas verificando token e perfil do usuário.
 * - Se não tiver token → redireciona para login
 * - Se o perfil não bater com o exigido → redireciona para login
 */
export default function RotaProtegida({ children, perfilExigido }) {
  const token = localStorage.getItem('token');
  const perfil = localStorage.getItem('usuario_perfil');

  // Sem token = não autenticado
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Perfil errado para esta rota
  if (perfilExigido && perfil !== perfilExigido) {
    return <Navigate to="/" replace />;
  }

  return children;
}
