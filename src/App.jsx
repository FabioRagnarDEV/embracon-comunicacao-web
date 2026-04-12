import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardMonitoria from './pages/DashboardMonitoria';
import DashboardAtendente from './pages/DashboardAtendente';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial é o Login */}
        <Route path="/" element={<Login />} />
        
        {/* Rotas dos Dashboards */}
        <Route path="/monitoria" element={<DashboardMonitoria />} />
        <Route path="/atendimento" element={<DashboardAtendente />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;