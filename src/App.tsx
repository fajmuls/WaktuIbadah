import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect, useState } from 'react';
import { storage } from './lib/storage';
import { motion, AnimatePresence } from 'motion/react';

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

const SplashScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50"
  >
    <motion.img 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      src="https://files.catbox.moe/3b6dqo.png" 
      alt="WaktuIbadah Logo" 
      className="w-32 h-32 rounded-2xl shadow-2xl mb-6"
    />
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="text-white text-3xl font-bold tracking-tight"
    >
      WaktuIbadah
    </motion.h1>
  </motion.div>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const user = storage.getUser();
    if (user && user.isOnboarded) {
      setHasOnboarded(true);
    }
    setIsReady(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return null;

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {!showSplash && (
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
      )}
    </>
  );
}
