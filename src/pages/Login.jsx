import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos o "navegador"

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate(); // Inicializamos o navegador

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Erro ao fazer login. Verifique as credenciais.');
      } else {
        // Guarda o token no navegador para o utilizador continuar logado
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario.id);
        

        if (data.usuario.perfil === 'MONITOR_QUALIDADE') {
          navigate('/monitoria');
        } else if (data.usuario.perfil === 'ATENDENTE') {
          navigate('/atendimento');
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setErro('Erro de ligação ao servidor. Verifique se a API está a correr.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Plataforma integradora</h1>
          <p className="text-gray-500">Faça o login para entrar no sistema</p>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg">
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
}