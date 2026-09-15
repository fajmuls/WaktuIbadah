import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles, Calendar as CalendarIcon, Search, Copy, Check, Filter } from 'lucide-react';
import { DoaItem, AsmaulHusnaItem } from '../types';
import { format } from 'date-fns';

export default function Tools() {
  const [activeTab, setActiveTab] = useState<'doa' | 'husna' | 'konversi'>('doa');

  // --- DOA STATE ---
  const [doaList, setDoaList] = useState<DoaItem[]>([]);
  const [isLoadingDoa, setIsLoadingDoa] = useState(true);
  const [searchDoa, setSearchDoa] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('semua');
  const [copiedDoaId, setCopiedDoaId] = useState<string | null>(null);

  // --- ASMAUL HUSNA STATE ---
  const [husnaList, setHusnaList] = useState<AsmaulHusnaItem[]>([]);
  const [isLoadingHusna, setIsLoadingHusna] = useState(true);
  const [searchHusna, setSearchHusna] = useState('');

  // --- KONVERSI KALENDER STATE ---
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [hijriResult, setHijriResult] = useState<{ dayName: string; hijriDate: string; masehiDate: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // 1. Fetch Doa from MyQuran API
  useEffect(() => {
    let isMounted = true;
    const fetchDoa = async () => {
      try {
        const res = await fetch('https://api.myquran.com/v2/doa/semua');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.status && Array.isArray(json.data)) {
            setDoaList(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load Doa from MyQuran API:", err);
      } finally {
        if (isMounted) setIsLoadingDoa(false);
      }
    };
    fetchDoa();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Asmaul Husna from MyQuran API
  useEffect(() => {
    let isMounted = true;
    const fetchHusna = async () => {
      try {
        const res = await fetch('https://api.myquran.com/v2/husna/semua');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.status && Array.isArray(json.data)) {
            setHusnaList(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load Asmaul Husna from MyQuran API:", err);
      } finally {
        if (isMounted) setIsLoadingHusna(false);
      }
    };
    fetchHusna();
    return () => { isMounted = false; };
  }, []);

  // 3. Convert Hijri Date using MyQuran API
  const convertDate = async (dateStr: string) => {
    setIsConverting(true);
    try {
      const res = await fetch(`https://api.myquran.com/v2/cal/hijr/${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status && json.data?.date) {
          setHijriResult({
            dayName: json.data.date[0],
            hijriDate: json.data.date[1],
            masehiDate: json.data.date[2],
          });
        }
      }
    } catch (err) {
      console.error("Failed to convert Hijri date:", err);
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    convertDate(selectedDate);
  }, [selectedDate]);

  // Copy Doa
  const handleCopyDoa = (item: DoaItem, index: number) => {
    const text = `${item.judul}\n\n${item.doa}\n\n${item.latin ? item.latin + '\n\n' : ''}Artinya:\n"${item.artinya}"\n\n(Dikutip dari WaktuIbadah - API MyQuran)`;
    navigator.clipboard.writeText(text);
    setCopiedDoaId(`${index}`);
    setTimeout(() => setCopiedDoaId(null), 2000);
  };

  // Filtered Doa
  const filteredDoa = useMemo(() => {
    return doaList.filter(d => {
      const matchesSearch = !searchDoa.trim() || 
        d.judul.toLowerCase().includes(searchDoa.toLowerCase()) || 
        d.artinya.toLowerCase().includes(searchDoa.toLowerCase());
      const matchesSource = selectedSource === 'semua' || d.source?.toLowerCase() === selectedSource.toLowerCase();
      return matchesSearch && matchesSource;
    });
  }, [doaList, searchDoa, selectedSource]);

  // Filtered Husna
  const filteredHusna = useMemo(() => {
    if (!searchHusna.trim()) return husnaList;
    const query = searchHusna.toLowerCase();
    return husnaList.filter(h => 
      h.latin.toLowerCase().includes(query) ||
      h.indo.toLowerCase().includes(query) ||
      h.id.toString() === query
    );
  }, [husnaList, searchHusna]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tools & Bantuan Islami</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Doa harian, 99 Asmaul Husna, dan konversi kalender Hijriyah resmi API MyQuran
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('doa')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'doa'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Heart className="w-4 h-4" />
            Doa Harian ({doaList.length || 108})
          </button>
          <button
            onClick={() => setActiveTab('husna')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'husna'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Asmaul Husna (99)
          </button>
          <button
            onClick={() => setActiveTab('konversi')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'konversi'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Konversi Hijriyah
          </button>
        </div>
      </header>

      {/* ======================= TAB 1: DOA HARIAN ======================= */}
      {activeTab === 'doa' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari doa (contoh: makan, tidur, rezeki, orang tua)..."
                value={searchDoa}
                onChange={(e) => setSearchDoa(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-text-main outline-none focus:border-primary shadow-sm"
              >
                <option value="semua">Semua Sumber</option>
                <option value="quran">Dari Al-Qur'an</option>
                <option value="hadits">Dari Hadits</option>
              </select>
            </div>
          </div>

          {/* Doa Cards List */}
          {isLoadingDoa ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoa.length > 0 ? (
                filteredDoa.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-text-main text-sm sm:text-base">
                          {item.judul}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.source && (
                          <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {item.source}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyDoa(item, index)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-text-muted hover:text-primary transition-colors"
                          title="Salin Doa"
                        >
                          {copiedDoaId === `${index}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arabic */}
                    <div className="text-right font-serif text-xl sm:text-2xl leading-loose text-gray-900 pr-1 py-1" dir="rtl">
                      {item.doa}
                    </div>

                    {/* Latin if available */}
                    {item.latin && (
                      <p className="text-xs text-primary/80 font-medium italic">
                        {item.latin}
                      </p>
                    )}

                    {/* Translation */}
                    <p className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs sm:text-sm text-text-main leading-relaxed">
                      <span className="font-bold text-primary mr-1">Artinya:</span>
                      "{item.artinya}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-text-muted text-sm">Tidak ada doa yang sesuai dengan pencarian Anda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: ASMAUL HUSNA ======================= */}
      {activeTab === 'husna' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari 99 Asmaul Husna (contoh: Ar-Rahman, Maha Pengasih, 1)..."
              value={searchHusna}
              onChange={(e) => setSearchHusna(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm shadow-sm"
            />
          </div>

          {/* Husna Grid */}
          {isLoadingHusna ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredHusna.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between text-center group"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-text-muted mb-2">
                    <span className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      {item.id}
                    </span>
                  </div>

                  {/* Arabic */}
                  <div className="font-serif text-2xl font-bold text-gray-800 my-2 group-hover:text-primary transition-colors">
                    {item.arab}
                  </div>

                  {/* Latin & Meaning */}
                  <div>
                    <h4 className="font-bold text-sm text-text-main">{item.latin}</h4>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">
                      {item.indo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: KONVERSI KALENDER HIJRIYAH ======================= */}
      {activeTab === 'konversi' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-text-main">Konverter Masehi ke Hijriyah</h2>
              <p className="text-xs text-text-muted mt-1">
                Gunakan API resmi MyQuran untuk menghitung konversi tanggal Masehi ke kalender Hijriyah secara akurat.
              </p>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted block">
                Pilih Tanggal Masehi:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-text-main outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Result Box */}
            <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 p-6 rounded-2xl border border-primary/20 text-center space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Hasil Konversi Hijriyah</span>
              
              {isConverting ? (
                <div className="py-4 text-sm text-text-muted animate-pulse">Menghitung kalender...</div>
              ) : hijriResult ? (
                <div className="space-y-1 py-2">
                  <div className="text-xs text-text-muted font-medium">
                    Hari {hijriResult.dayName}
                  </div>
                  <div className="text-2xl font-extrabold text-primary font-serif">
                    {hijriResult.hijriDate}
                  </div>
                  <div className="text-xs text-text-muted mt-2">
                    Masehi: {hijriResult.masehiDate}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-text-muted">Gagal mendapatkan konversi.</div>
              )}
            </div>

            {/* Quick date presets */}
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                Hari Ini
              </button>
              <button
                onClick={() => setSelectedDate('2026-03-20')}
                className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                Ramadan 2026
              </button>
              <button
                onClick={() => setSelectedDate('2026-04-10')}
                className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                Idul Fitri 2026
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
