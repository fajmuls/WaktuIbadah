import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Reflection as ReflectionType } from '../types';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reflection() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [reflection, setReflection] = useState<Partial<ReflectionType>>({
    date: today,
    q1: '', q2: '', q3: '', q4: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const existing = storage.getReflection(today);
    if (existing) {
      setReflection(existing);
      setIsSaved(true); // If it exists, they already filled it out roughly
    }
  }, [today]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateReflection(reflection as ReflectionType);
    setIsSaved(true);
    setTimeout(() => {
      navigate('/menu');
    }, 2000);
  };

  if (isSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Terima Kasih</h2>
        <p className="text-text-muted mb-8 max-w-xs">Refleksi harianmu telah disimpan. Semoga esok hari lebih baik lagi.</p>
        <button onClick={() => navigate('/menu')} className="text-primary font-bold">Kembali ke Menu</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-md mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold text-text-main">Refleksi Harian</h1>
        <p className="text-text-muted text-sm mt-1">Evaluasi singkat sebelum istirahat</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block font-bold mb-3">1. Apakah jadwal hari ini berjalan sesuai rencana?</label>
          <div className="flex gap-2">
            {['Ya', 'Sebagian', 'Tidak'].map(opt => (
              <button
                type="button"
                key={opt}
                onClick={() => setReflection({...reflection, q1: opt})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${reflection.q1 === opt ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block font-bold mb-3">2. Apa yang paling mengganggu waktumu hari ini?</label>
          <textarea 
            required
            value={reflection.q2}
            onChange={(e) => setReflection({...reflection, q2: e.target.value})}
            placeholder="Misal: Terlalu lama scroll media sosial..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block font-bold mb-3">3. Apakah kamu merasa waktu ibadahmu sudah cukup teratur?</label>
          <div className="flex gap-2">
            {['Sudah', 'Lumayan', 'Belum'].map(opt => (
              <button
                type="button"
                key={opt}
                onClick={() => setReflection({...reflection, q3: opt})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${reflection.q3 === opt ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block font-bold mb-3">4. Apa yang ingin kamu perbaiki besok?</label>
          <textarea 
            required
            value={reflection.q4}
            onChange={(e) => setReflection({...reflection, q4: e.target.value})}
            placeholder="Misal: Ingin bangun lebih pagi..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button 
          type="submit"
          disabled={!reflection.q1 || !reflection.q2 || !reflection.q3 || !reflection.q4}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          Simpan Refleksi
        </button>

      </form>

    </div>
  );
}
