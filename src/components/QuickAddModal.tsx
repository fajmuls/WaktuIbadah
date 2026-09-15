import React from 'react';
import { X, CheckSquare, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal = ({ isOpen, onClose }: QuickAddModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const options = [
    { label: 'Tambah Tugas', icon: CheckSquare, path: '/tugas/baru', color: 'bg-blue-100 text-blue-600' },
    { label: 'Tambah Jadwal', icon: Calendar, path: '/jadwal/baru', color: 'bg-green-100 text-green-600' },
    { label: 'Catat Ibadah', icon: Clock, path: '/ibadah', color: 'bg-amber-100 text-amber-600' },
  ];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-sm rounded-3xl p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-text-main">Tambahkan</h2>
        
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.path)}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 text-left"
            >
              <div className={`p-3 rounded-xl ${opt.color}`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-lg">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
