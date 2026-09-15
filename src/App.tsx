import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect, useState } from 'react';
import { storage } from './lib/storage';

// Pages
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Jadwal from './pages/Jadwal';
import Tugas from './pages/Tugas';
import Ibadah from './pages/Ibadah';
import Progress from './pages/Progress';
import Menu from './pages/Menu';
import FocusMode from './pages/FocusMode';
import Reflection from './pages/Reflection';
import Settings from './pages/Settings';
import Tips from './pages/Tips';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const user = storage.getUser();
    if (user && user.isOnboarded) {
      setHasOnboarded(true);
    }
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <BrowserRouter>
      <Routes>
        {!hasOnboarded ? (
          <Route path="*" element={<Onboarding onComplete={() => setHasOnboarded(true)} />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jadwal" element={<Jadwal />} />
            <Route path="/jadwal/baru" element={<Jadwal isNew />} />
            <Route path="/tugas" element={<Tugas />} />
            <Route path="/tugas/baru" element={<Tugas isNew />} />
            <Route path="/ibadah" element={<Ibadah />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/reflection" element={<Reflection />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
