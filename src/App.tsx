import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import NavBar from './components/Layout/NavBar';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';
import HistoryPage from './pages/HistoryPage';
import ToolsPage from './pages/ToolsPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/play"    element={<PlayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/tools"   element={<ToolsPage />} />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: 'var(--card)', color: 'var(--heading)', border: '1px solid var(--border)' },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

