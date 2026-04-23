import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardMonitoria from './pages/DashboardMonitoria';
import DashboardAtendente from './pages/DashboardAtendente';
import RotaProtegida from './components/RotaProtegida';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />

        {/* Apenas MONITOR_QUALIDADE */}
        <Route path="/monitoria" element={
          <RotaProtegida perfilExigido="MONITOR_QUALIDADE">
            <DashboardMonitoria />
          </RotaProtegida>
        } />

        {/* Apenas ATENDENTE */}
        <Route path="/atendimento" element={
          <RotaProtegida perfilExigido="ATENDENTE">
            <DashboardAtendente />
          </RotaProtegida>
        } />

        {/* Qualquer rota desconhecida → login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
