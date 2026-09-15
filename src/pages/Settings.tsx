import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { User, AppVersion } from '../types';
import { User as UserIcon, Bell, Trash2, Info, ChevronRight, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    if (loadedUser) setNameInput(loadedUser.name);
    
    setVersion(storage.getVersion());
  }, []);

  const handleSaveName = () => {
    if (user && nameInput.trim()) {
      const updated = { ...user, name: nameInput.trim() };
      storage.setUser(updated);
      setUser(updated);
      setIsEditingName(false);
    }
  };

  const handleToggleReminder = () => {
    if (user) {
      const updated = { ...user, reminderEnabled: !user.reminderEnabled };
      storage.setUser(updated);
      setUser(updated);
      
      if (updated.reminderEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }
    }
  };

  const handleClearData = () => {
    if (confirm('PERINGATAN: Apakah kamu yakin ingin menghapus seluruh data? Tindakan ini tidak dapat dibatalkan.')) {
      storage.clearAll();
      navigate('/');
      window.location.reload();
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold text-text-main">Pengaturan</h1>
      </div>

      <div className="bg-surface rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Profil */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <UserIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-text-muted">Nama Pengguna</h3>
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-1.5 bg-primary text-white rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-bold text-lg">{user.name}</p>
                  <button onClick={() => setIsEditingName(true)} className="text-sm text-primary font-medium hover:underline">Edit</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifikasi */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-main">Pengingat</h3>
              <p className="text-sm text-text-muted">Notifikasi salat dan deadline</p>
            </div>
          </div>
          <button 
            onClick={handleToggleReminder}
            className={`w-12 h-6 rounded-full transition-colors relative ${user.reminderEnabled ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm ${user.reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Suara */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-main">Efek Suara</h3>
              <p className="text-sm text-text-muted">Suara klik dan alarm</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const updated = { ...user, soundEnabled: user.soundEnabled !== false ? false : true };
              storage.setUser(updated);
              setUser(updated);
            }}
            className={`w-12 h-6 rounded-full transition-colors relative ${user.soundEnabled !== false ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${user.soundEnabled !== false ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Format Waktu */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-main">Format Waktu</h3>
              <p className="text-sm text-text-muted">12 Jam (AM/PM) atau 24 Jam</p>
            </div>
          </div>
          <select 
            value={user.timeFormat || '24h'}
            onChange={(e) => {
              const updated = { ...user, timeFormat: e.target.value as '12h' | '24h' };
              storage.setUser(updated);
              setUser(updated);
            }}
            className="p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium"
          >
            <option value="24h">24 Jam</option>
            <option value="12h">12 Jam</option>
          </select>
        </div>

        {/* Hapus Data */}
        <button 
          onClick={handleClearData}
          className="w-full p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between hover:bg-red-50 transition-colors text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-600">Hapus Semua Data</h3>
              <p className="text-sm text-red-400">Tindakan ini permanen</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-300" />
        </button>

        {/* Info */}
        <div className="p-4 sm:p-6 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-main">Versi Aplikasi</h3>
              <p className="text-sm text-text-muted">
                {version?.version} 
                <span className="text-xs ml-2 text-primary font-medium">Terbaru!</span>
              </p>
            </div>
          </div>
        </div>

      </div>
      
      <div className="text-center">
        <p className="text-xs text-text-muted">Dibuat untuk memenuhi proyek mata kuliah Pendidikan Agama Islam.</p>
      </div>

    </div>
  );
}
