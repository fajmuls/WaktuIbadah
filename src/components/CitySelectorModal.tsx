import React, { useState } from 'react';
import { Search, MapPin, X, Check, Loader2, Compass } from 'lucide-react';
import { searchMyQuranCities, POPULAR_CITIES, fetchPrayerTimesByCityId } from '../lib/prayer-times';

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

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
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
    try {
      await fetchPrayerTimesByCityId(city.id, city.lokasi);
      onCitySelected(city.id, city.lokasi);
      onClose();
    } catch (e) {
      console.error("Failed to select city:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Pilih Kota Jadwal Salat
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Standar Kementerian Agama RI (MyQuran API)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama kota (contoh: Surabaya, Bandung, Medan)..."
              className="w-full pl-10 pr-20 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
          </form>
        </div>

        {/* City Lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* If search query entered and submitted */}
          {hasSearched && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Hasil Pencarian ({searchResults.length})
              </h3>
              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                  <span className="text-xs">Mencari kota di database Kemenag...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  Tidak ditemukan kota dengan nama "{query}". Coba kata kunci lain atau pilih kota terdekat di bawah.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((city) => {
                    const isSelected = city.id === currentCityId;
                    return (
                      <button
                        key={city.id}
                        onClick={() => handleSelect(city)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span>{city.lokasi}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Popular Cities */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Kota & Kabupaten Populer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {POPULAR_CITIES.map((city) => {
                const isSelected = city.id === currentCityId;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelect(city)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                        : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-emerald-200 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="truncate">{city.lokasi}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center text-[11px] text-gray-400">
          Waktu salat disinkronkan langsung dari jadwal resmi Kementerian Agama RI
        </div>
      </div>
    </div>
  );
};
