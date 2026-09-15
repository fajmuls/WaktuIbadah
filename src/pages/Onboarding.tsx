import React, { useState } from 'react';
import { storage } from '../lib/storage';
import { User } from '../types';
import { ArrowRight, Clock } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    target: '',
    reminderEnabled: false,
    useFocusMode: true,
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const user: User = {
        name: formData.name || 'Mahasiswa',
        target: formData.target || 'Mengatur waktu lebih baik',
        reminderEnabled: formData.reminderEnabled || false,
        useFocusMode: formData.useFocusMode || true,
        isOnboarded: true,
      };
      storage.setUser(user);
      
      // Request notification permission if enabled
      if (user.reminderEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }
      
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl shadow-primary/5">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Selamat datang di WaktuIbadah</h1>
        <p className="text-text-muted text-center mb-8">Atur Waktu, Jaga Ibadah.</p>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block font-medium mb-2">Siapa nama kamu?</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Misal: Ahmad"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block font-medium mb-2">Apa target utama kamu menggunakan aplikasi ini?</label>
              <textarea 
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[100px]"
                placeholder="Misal: Ingin lebih teratur mengerjakan tugas dan tidak menunda salat."
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-semibold">Aktifkan Pengingat</h3>
                <p className="text-sm text-text-muted">Notifikasi waktu salat dan deadline</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                className="w-6 h-6 text-primary rounded-md focus:ring-primary accent-primary"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-semibold">Fitur Focus Mode</h3>
                <p className="text-sm text-text-muted">Timer untuk membantu fokus belajar</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.useFocusMode}
                onChange={(e) => setFormData({ ...formData, useFocusMode: e.target.checked })}
                className="w-6 h-6 text-primary rounded-md focus:ring-primary accent-primary"
              />
            </div>
          </div>
        )}

        <button 
          onClick={handleNext}
          disabled={step === 1 && !formData.name?.trim()}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step < 3 ? 'Lanjut' : 'Mulai Sekarang'}
          <ArrowRight className="w-5 h-5" />
        </button>
        
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
