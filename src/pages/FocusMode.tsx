import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Task } from '../types';
import { Play, Pause, Square, RefreshCcw } from 'lucide-react';

export default function FocusMode() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  const [duration, setDuration] = useState(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const activeTasks = storage.getTasks().filter(t => t.status !== 'Selesai');
    setTasks(activeTasks);
    if (activeTasks.length > 0) setSelectedTaskId(activeTasks[0].id);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      
      // Save session
      storage.addFocusSession({
        id: crypto.randomUUID(),
        taskId: selectedTaskId || undefined,
        duration: duration / 60,
        completedAt: new Date().toISOString()
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sesi Fokus Selesai!', { body: 'Waktunya istirahat sejenak.' });
      } else {
        alert('Sesi Fokus Selesai! Waktunya istirahat sejenak.');
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, duration, selectedTaskId]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const setPreset = (mins: number) => {
    setIsActive(false);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-main">Focus Mode</h1>
        <p className="text-text-muted text-sm mt-1">Jauhkan distraksi, selesaikan lebih cepat</p>
      </div>

      <div className="bg-surface rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center max-w-sm mx-auto">
        
        {/* Circular Progress (Simplified) */}
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="4" />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#166534" 
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-5xl font-bold text-text-main tracking-tighter">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={toggleTimer}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
          <button 
            onClick={resetTimer}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors active:scale-95"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 w-full">
          <button onClick={() => setPreset(25)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${duration === 25*60 ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>25 mnt</button>
          <button onClick={() => setPreset(50)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${duration === 50*60 ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>50 mnt</button>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm max-w-sm mx-auto">
        <label className="block text-sm font-bold mb-2 text-text-main">Sedang Mengerjakan:</label>
        <select 
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          disabled={isActive}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        >
          <option value="">Pilih Tugas...</option>
          {tasks.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

    </div>
  );
}
