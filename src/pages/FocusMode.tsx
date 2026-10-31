import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Task } from '../types';
import { Play, Pause, Square, RefreshCcw, Music } from 'lucide-react';
import { playFocusSound, toggleAmbientLoop, isAmbientPlaying } from '../lib/audio';
import { showPWANotification } from '../lib/pwa-service';

export default function FocusMode() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  const [duration, setDuration] = useState(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [ambientActive, setAmbientActive] = useState(false);

  useEffect(() => {
    const activeTasks = storage.getTasks().filter(t => t.status !== 'Selesai');
    setTasks(activeTasks);
    if (activeTasks.length > 0) setSelectedTaskId(activeTasks[0].id);
    setAmbientActive(isAmbientPlaying());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      playFocusSound('end');
      
      // Save session
      storage.addFocusSession({
        id: crypto.randomUUID(),
        taskId: selectedTaskId || undefined,
        duration: duration / 60,
        completedAt: new Date().toISOString()
      });

      showPWANotification('🎉 Sesi Fokus Selesai!', {
        body: 'Alhamdulillah, target fokus tercapai! Waktunya istirahat sejenak dan salat.',
        tag: 'focus-session-completed'
      });
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, duration, selectedTaskId]);

  const toggleTimer = () => {
    if (!isActive) {
      playFocusSound('start');
    }
    setIsActive(!isActive);
  };
  
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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-md mx-auto pb-20">
      
      {/* Header */}
      <div className="p-4 bg-[#00F0FF] border-[2.5px] border-black rounded-2xl shadow-[4px_4px_0px_#121212] text-center">
        <h1 className="text-xl font-black uppercase tracking-tight text-black">Focus Pomodoro</h1>
        <p className="text-xs font-bold text-black/80 mt-0.5">Jauhkan distraksi, seimbangkan waktu ibadah & produktivitas</p>
      </div>

      <div className="memphis-card p-6 flex flex-col items-center justify-center space-y-5">
        
        {/* Circular Progress (Memphis Styling) */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle 
              cx="50" cy="50" r="44" 
              fill="none" 
              stroke="#FFE600" 
              strokeWidth="6"
              strokeDasharray="276"
              strokeDashoffset={276 - (276 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-[#121212] font-mono tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-1">
              {isActive ? 'Sedang Fokus' : 'Siap Mulai'}
            </span>
          </div>
        </div>

        {/* Task Selection */}
        {tasks.length > 0 && (
          <div className="w-full">
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Fokus Mengerjakan Tugas:
            </label>
            <select 
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="memphis-input w-full p-2.5 text-xs font-bold"
            >
              <option value="">(Tanpa Tugas Spesifik)</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Presets */}
        <div className="flex gap-2">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => setPreset(mins)}
              className={`memphis-btn px-3 py-1 text-xs font-black uppercase ${
                duration === mins * 60 ? 'memphis-btn-yellow' : 'memphis-btn-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full pt-2">
          <button
            onClick={toggleTimer}
            className={`memphis-btn flex-1 py-3 text-xs font-black uppercase tracking-wider gap-2 ${
              isActive ? 'memphis-btn-pink' : 'memphis-btn-primary'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isActive ? 'Jeda' : 'Mulai Fokus'}</span>
          </button>
          
          <button
            onClick={resetTimer}
            className="memphis-btn memphis-btn-white p-3"
            title="Reset Timer"
          >
            <RefreshCcw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Instrumental Ambient Music Toggle */}
        <button
          onClick={() => {
            const playing = toggleAmbientLoop(0.4);
            setAmbientActive(playing);
          }}
          className={`memphis-btn w-full py-2.5 text-xs font-black uppercase tracking-wider gap-2 ${
            ambientActive ? 'memphis-btn-yellow' : 'memphis-btn-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>{ambientActive ? 'Musik Relaksasi Ambient: ON' : 'Putar Musik Ambient 90s'}</span>
        </button>

      </div>

    </div>
  );
}
