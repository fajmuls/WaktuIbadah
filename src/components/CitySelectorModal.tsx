import React, { useState } from 'react';
import { Search, MapPin, X, Check, Loader2, Compass } from 'lucide-react';
import { searchMyQuranCities, POPULAR_CITIES, fetchPrayerTimesByCityId } from '../lib/prayer-times';
import { INDONESIAN_CITIES } from '../data/indonesian-cities';
import { storage } from '../lib/storage';
import { playButtonTapSound, playSaveSuccessSound } from '../lib/audio';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelected: (cityId: string, cityName: string) => void;
  currentCityId?: string;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  onCitySelected,
  currentCityId = '1301',
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; lokasi: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTzFilter, setActiveTzFilter] = useState<'ALL' | 'WIB' | 'WITA' | 'WIT'>('ALL');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    playButtonTapSound();
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchMyQuranCities(query);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (city: { id: string; lokasi: string }) => {
    playSaveSuccessSound();
    try {
      await fetchPrayerTimesByCityId(city.id, city.lokasi);
      storage.setSelectedCity(city.lokasi);
      onCitySelected(city.id, city.lokasi);
      onClose();
    } catch (e) {
      console.error("Failed to select city:", e);
    }
  };

  const filteredPresetCities = INDONESIAN_CITIES.filter(c => {
    if (activeTzFilter === 'ALL') return true;
    return c.timezone === activeTzFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl border-[3px] border-[#121212] shadow-[5px_5px_0px_#121212] flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-b-[2.5px] border-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#121212] shrink-0">
              <Compass className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#121212] uppercase tracking-tight">
                Pilih Kota & Zona Waktu
              </h2>
              <p className="text-[11px] font-bold text-gray-800">
                WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center hover:bg-gray-100 shadow-[1.5px_1.5px_0px_#121212] font-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b-2 border-[#121212] bg-[#FFFDF8]">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama kota (Surabaya, Makassar, Jayapura, dll)..."
              className="memphis-input w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm font-bold"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 memphis-btn memphis-btn-green px-3 py-1 text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
          </form>

          {/* Timezone Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-1 overflow-x-auto hide-scrollbar">
            {(['ALL', 'WIB', 'WITA', 'WIT'] as const).map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => setActiveTzFilter(tz)}
                className={`memphis-badge px-2.5 py-1 text-[9px] cursor-pointer transition-all ${
                  activeTzFilter === tz
                    ? 'bg-black text-[#6EE7B7] shadow-[2px_2px_0px_#10B981]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tz === 'ALL' ? 'Semua Wilayah' : `Zona ${tz}`}
              </button>
            ))}
          </div>
        </div>

        {/* City Lists */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {/* If search query entered and submitted */}
          {hasSearched && (
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2">
                Hasil Pencarian Kemenag ({searchResults.length})
              </h3>
              {isSearching ? (
                <div className="py-6 flex flex-col items-center justify-center text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                  <span className="text-xs font-bold">Mencari kota di database Kemenag...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-xs bg-gray-50 border-2 border-dashed border-black rounded-xl">
                  Tidak ditemukan kota "{query}". Silakan pilih dari daftar kota rujukan di bawah.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((city) => {
                    const isSelected = city.id === currentCityId;
                    return (
                      <button
                        key={city.id}
                        onClick={() => handleSelect(city)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-between border-2 border-black ${
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-[2px_2px_0px_#121212]'
                            : 'bg-white hover:bg-emerald-50 text-black shadow-[1.5px_1.5px_0px_#121212]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{city.lokasi}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Preset Major Indonesian Cities with Timezone Indicators */}
          <div>
            <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Kota Rujukan ({filteredPresetCities.length})</span>
              <span className="text-[10px] text-gray-500 font-bold">Resmi Kemenag RI</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPresetCities.map((city) => {
                const popularMatch = POPULAR_CITIES.find(p => p.lokasi.toLowerCase().includes(city.name.toLowerCase()));
                const cityId = popularMatch?.id || '1301';
                const isSelected = cityId === currentCityId || storage.getSelectedCity().toLowerCase().includes(city.name.toLowerCase());

                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelect({ id: cityId, lokasi: `KOTA ${city.name.toUpperCase()}` })}
                    className={`text-left p-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border-2 border-black ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[2px_2px_0px_#121212]'
                        : 'bg-[#FFFDF8] hover:bg-emerald-50 text-black shadow-[1.5px_1.5px_0px_#121212]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{city.name}</span>
                        <span className={`text-[8px] px-1 rounded border border-black font-black ${
                          city.timezone === 'WIB' ? 'bg-[#00F0FF] text-black' :
                          city.timezone === 'WITA' ? 'bg-[#FF4B91] text-white' :
                          'bg-[#FFE600] text-black'
                        }`}>
                          {city.timezone}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-500 truncate mt-0.5">
                        {city.province}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-2 border-[#121212] text-center text-[10px] font-bold text-gray-500">
          Jadwal salat terkalibrasi otomatis berdasarkan lintang/bujur & zona waktu wilayah
        </div>
      </div>
    </div>
  );
};
