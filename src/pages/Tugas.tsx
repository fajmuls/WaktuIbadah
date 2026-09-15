import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Task } from '../types';
import { format, isPast, isToday as isDateToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, X, CheckCircle2, Circle, AlertCircle, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface TugasProps {
  isNew?: boolean;
}

export default function Tugas({ isNew = false }: TugasProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'Semua' | 'Hari ini' | 'Terlambat' | 'Selesai'>('Semua');
  const [showForm, setShowForm] = useState(isNew);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    deadline: format(new Date(), 'yyyy-MM-dd'),
    priority: 'Sedang',
    status: 'Belum mulai'
  });

  useEffect(() => {
    loadTasks();
    if (isNew) setShowForm(true);
  }, [isNew]);

  const loadTasks = () => {
    const all = storage.getTasks();
    // Sort by deadline, then priority
    all.sort((a, b) => {
      const dateDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (dateDiff !== 0) return dateDiff;
      const prioOrder = { 'Tinggi': 1, 'Sedang': 2, 'Rendah': 3 };
      return prioOrder[a.priority] - prioOrder[b.priority];
    });
    setTasks(all);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const newTask: Task = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title!,
      description: formData.description || '',
      deadline: formData.deadline!,
      priority: formData.priority as Task['priority'],
      status: formData.status as Task['status'],
      createdAt: formData.createdAt || new Date().toISOString()
    };

    if (formData.id) {
      storage.updateTask(newTask);
    } else {
      storage.addTask(newTask);
    }

    loadTasks();
    setShowForm(false);
    if (isNew) navigate('/tugas', { replace: true });
    
    setFormData({
      title: '',
      description: '',
      deadline: format(new Date(), 'yyyy-MM-dd'),
      priority: 'Sedang',
      status: 'Belum mulai'
    });
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === 'Selesai' ? 'Belum mulai' : 'Selesai';
    storage.updateTask({ ...task, status: newStatus });
    loadTasks();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus tugas ini?')) {
      storage.deleteTask(id);
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'Semua') return task.status !== 'Selesai';
    if (filter === 'Selesai') return task.status === 'Selesai';
    
    const deadlineDate = new Date(task.deadline);
    // Ignore time for comparison
    deadlineDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (filter === 'Hari ini') {
      return deadlineDate.getTime() === today.getTime() && task.status !== 'Selesai';
    }
    if (filter === 'Terlambat') {
      return deadlineDate.getTime() < today.getTime() && task.status !== 'Selesai';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tugas</h1>
          <p className="text-text-muted text-sm mt-1">Selesaikan tugasmu satu per satu</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="hidden md:flex bg-primary text-white p-2 px-4 rounded-xl items-center gap-2 font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" /> Tambah
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{formData.id ? 'Edit' : 'Tambah'} Tugas</h2>
            <button onClick={() => { setShowForm(false); if(isNew) navigate('/tugas'); }} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul Tugas</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="Misal: Makalah PAI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none min-h-[100px]"
                placeholder="Tambahkan catatan jika perlu..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prioritas</label>
              <div className="flex gap-2">
                {['Rendah', 'Sedang', 'Tinggi'].map(prio => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setFormData({...formData, priority: prio as any})}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors border ${
                      formData.priority === prio 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-4 mt-6 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Simpan Tugas
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
            {(['Semua', 'Hari ini', 'Terlambat', 'Selesai'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  filter === f 
                    ? "bg-text-main text-white shadow-md" 
                    : "bg-surface border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const isLate = new Date(task.deadline).getTime() < new Date().setHours(0,0,0,0) && task.status !== 'Selesai';
                const isDone = task.status === 'Selesai';
                
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "bg-surface rounded-3xl p-4 sm:p-5 border shadow-sm transition-all group",
                      isDone ? "border-gray-100 opacity-60" : isLate ? "border-red-200 bg-red-50/30" : "border-gray-100 hover:border-primary/30"
                    )}
                  >
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleToggleComplete(task)}
                        className="mt-1 shrink-0 text-gray-300 hover:text-primary transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-7 h-7 text-primary" />
                        ) : (
                          <Circle className="w-7 h-7" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className={cn("text-lg font-semibold truncate", isDone && "line-through text-gray-500")}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setFormData(task); setShowForm(true); }} className="text-xs text-blue-600 font-medium hover:underline px-2">Edit</button>
                             <button onClick={() => handleDelete(task.id)} className="text-xs text-red-600 font-medium hover:underline px-2">Hapus</button>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold",
                            isLate ? "bg-red-100 text-red-700" : isDone ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700"
                          )}>
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(new Date(task.deadline), 'd MMM yyyy', { locale: id })}
                            {isLate && " (Terlambat)"}
                          </div>
                          
                          {task.priority === 'Tinggi' && !isDone && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Prioritas Tinggi
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-dashed border-gray-200 rounded-3xl">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-bold text-lg mb-1">Semua Tugas Aman</h3>
                <p className="text-gray-500 font-medium mb-6">Tambahkan tugas baru jika ada.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors"
                >
                  Tambah Tugas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
