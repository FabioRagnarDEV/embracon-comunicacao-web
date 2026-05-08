import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import megafoneEsquerdo   from '../assets/megafoneladoesquerdo.png';
import comunicadoDireito  from '../assets/comunicado lado direito.png';

export default function Login() {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar,      setLembrar]      = useState(false);
  const [erro,         setErro]         = useState('');
  const [carregando,   setCarregando]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const data = await authService.login(email, password);
      if (data.usuario.perfil === 'MONITOR_QUALIDADE') navigate('/monitoria');
      else if (data.usuario.perfil === 'ATENDENTE')    navigate('/atendimento');
    } catch (err) {
      setErro(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0f172a' }}
    >
      {/* ── Fundo animado com gradientes ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ width: 600, height: 600, background: 'radial-gradient(circle, #1d4ed8, transparent)', top: '-150px', left: '-150px' }} />
        <div className="absolute rounded-full blur-3xl opacity-20"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle, #7c3aed, transparent)', bottom: '-100px', right: '-100px', animationDelay: '1s' }} />
        <div className="absolute rounded-full blur-2xl opacity-15"
          style={{ width: 300, height: 300, background: 'radial-gradient(circle, #0ea5e9, transparent)', top: '40%', left: '60%' }} />
        {/* Grid de pontos decorativos */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ── Card principal ── */}
      <div className="relative z-10 w-full flex shadow-2xl overflow-hidden"
        style={{ maxWidth: '900px', minHeight: '560px', borderRadius: '28px', margin: '16px' }}
      >

        {/* ════════════════════════════════
            PAINEL ESQUERDO
        ════════════════════════════════ */}
        <div className="hidden lg:flex flex-col justify-between relative overflow-hidden"
          style={{
            width: '45%',
            background: 'linear-gradient(145deg, #1e40af 0%, #1d4ed8 45%, #2563eb 100%)',
            padding: '52px 44px',
          }}
        >
          {/* Círculos decorativos */}
          <div className="absolute rounded-full"
            style={{ width: 280, height: 280, background: 'rgba(255,255,255,0.06)', top: -80, right: -80 }} />
          <div className="absolute rounded-full"
            style={{ width: 180, height: 180, background: 'rgba(255,255,255,0.04)', bottom: 60, left: -60 }} />

          {/* Logo / Marca */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              {/* Imagem do megafone lado esquerdo — tamanho grande como no design */}
              <img
                src={megafoneEsquerdo}
                alt="Fique Ligado"
                style={{
                  width: 76,
                  height: 76,
                  objectFit: 'contain',
                  borderRadius: '18px',
                  flexShrink: 0,
                }}
              />
              <div>
                <p className="font-black text-white leading-tight" style={{ fontSize: '22px' }}>Fique Ligado</p>
                <p className="text-blue-200 font-medium" style={{ fontSize: '14px', marginTop: '2px' }}>Portal de Comunicados</p>
              </div>
            </div>
          </div>

          {/* Ilustração central — tela de comunicado */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-8">
            <div className="relative">
              {/* Card flutuante principal */}
              <div className="rounded-2xl shadow-2xl overflow-hidden"
                style={{ width: 240, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {/* Header do card */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white text-xs font-bold ml-2 opacity-70">Comunicado</span>
                </div>
                {/* Conteúdo simulado */}
                <div className="p-4 space-y-2.5">
                  <div className="h-3 rounded-full bg-white opacity-60" style={{ width: '80%' }} />
                  <div className="h-2.5 rounded-full bg-white opacity-30" style={{ width: '100%' }} />
                  <div className="h-2.5 rounded-full bg-white opacity-30" style={{ width: '90%' }} />
                  <div className="h-2.5 rounded-full bg-white opacity-30" style={{ width: '70%' }} />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 rounded-lg flex-1 bg-white opacity-20" />
                    <div className="h-6 rounded-lg px-3 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.3)' }}
                    >
                      <span className="text-white text-[10px] font-bold">Ler</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flutuante — notificação */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg"
                style={{ background: '#ef4444', border: '2px solid rgba(255,255,255,0.3)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-black">3 novos</span>
              </div>

              {/* Badge flutuante — usuários */}
              <div className="absolute -bottom-3 -left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span className="text-white text-[10px] font-bold">248 ativos</span>
              </div>
            </div>
          </div>

          {/* Texto e features */}
          <div className="relative z-10">
            <h2 className="font-black text-white text-xl leading-snug mb-2">
              Bem-vindo ao<br /><span style={{ color: '#93c5fd' }}>Fique Ligado</span>
            </h2>
            <div className="w-8 h-0.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.4)' }} />
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              A plataforma que conecta monitores e atendentes — comunicados, scripts e atualizações sempre ao alcance.
            </p>

            {/* 3 features */}
            <div className="flex items-start justify-between pt-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
            >
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                  ),
                  label: 'Comunicados\nimportantes',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  ),
                  label: 'Informações\norganizadas',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  ),
                  label: 'Acesso seguro\ne confiável',
                },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2" style={{ flex: 1 }}>
                  <div className="flex items-center justify-center rounded-xl"
                    style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)' }}
                  >
                    {icon}
                  </div>
                  <span className="text-blue-100 leading-tight" style={{ fontSize: '10px', whiteSpace: 'pre-line' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-white"
          style={{ padding: '52px 48px' }}
        >

          <div className="mb-5">
            <img
              src={comunicadoDireito}
              alt="Portal de Comunicados"
              style={{ width: 68, height: 68, objectFit: 'contain' }}
            />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="font-black text-slate-800" style={{ fontSize: '28px', lineHeight: 1.15 }}>
              Fique <span style={{ color: '#1d4ed8' }}>Ligado</span>
            </h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed" style={{ maxWidth: '280px', margin: '8px auto 0' }}>
              Comunicados, scripts e informações da equipe — tudo em um só lugar, em tempo real.
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div className="w-full mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', maxWidth: '360px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <p className="text-red-600 text-sm font-medium">{erro}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full space-y-4" style={{ maxWidth: '360px' }}>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 rounded-xl outline-none transition-all"
                  style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                  onFocus={e => { e.target.style.borderColor = '#1d4ed8'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm text-slate-800 placeholder-slate-400 rounded-xl outline-none transition-all"
                  style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                  onFocus={e => { e.target.style.borderColor = '#1d4ed8'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {mostrarSenha ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar + Esqueceu */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#1d4ed8' }}
                />
                <span className="text-sm text-slate-600">Lembrar-me</span>
              </label>
              <button type="button" className="text-sm font-semibold transition-colors"
                style={{ color: '#1d4ed8' }}
                onMouseEnter={e => e.currentTarget.style.color = '#1e40af'}
                onMouseLeave={e => e.currentTarget.style.color = '#1d4ed8'}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: carregando ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #1d4ed8 50%, #2563eb)',
                boxShadow: carregando ? 'none' : '0 4px 20px rgba(29,78,216,0.35)',
                cursor: carregando ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!carregando) e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,78,216,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.35)'; }}
            >
              {carregando ? (
                <>
                  <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Entrar
                </>
              )}
            </button>

          </form>

          {/* Rodapé */}
          <p className="mt-8 text-xs text-slate-400 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Seus dados estão protegidos com segurança.
          </p>
        </div>
      </div>
    </div>
  );
}
