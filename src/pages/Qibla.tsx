import React, { useState, useEffect } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { storage } from '../lib/storage';

export default function Qibla() {
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Kaba coordinates
  const kabaLat = 21.422487;
  const kabaLng = 39.826206;

  const calculateQibla = (lat: number, lng: number) => {
    // Math to calculate Qibla direction from lat/lng
    const latK = kabaLat * (Math.PI / 180.0);
    const lngK = kabaLng * (Math.PI / 180.0);
    const phi = lat * (Math.PI / 180.0);
    const lambda = lng * (Math.PI / 180.0);

    const y = Math.sin(lngK - lambda);
    const x = Math.cos(phi) * Math.tan(latK) - Math.sin(phi) * Math.cos(lngK - lambda);
    let qibla = Math.atan2(y, x) * (180.0 / Math.PI);
    
    qibla = (qibla + 360) % 360;
    setQiblaBearing(qibla);
  };

  useEffect(() => {
    // 1. Get location
    const user = storage.getUser();
    if (user?.location) {
      calculateQibla(user.location.latitude, user.location.longitude);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => calculateQibla(pos.coords.latitude, pos.coords.longitude),
          (err) => setError("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.")
        );
      } else {
        setError("Peramban ini tidak mendukung Geolocation.");
      }
    }

    // 2. Compass Sensor
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let alpha = event.alpha; // Compass heading if absolute
      
      // Try to get webkitCompassHeading for iOS
      if ('webkitCompassHeading' in event) {
        alpha = (event as any).webkitCompassHeading;
      } else if (alpha !== null) {
        // Absolute orientation API standard
        // alpha is 0 at east sometimes or north. It varies.
        // Actually for standard absolute, alpha is degrees from North, counter-clockwise.
        // We negate it to make it clockwise like standard compass.
        alpha = 360 - alpha;
      }
      
      if (alpha !== null) {
        setHeading(alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      // iOS 13+ requires permission
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
         // Need a button to request permission
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', (e) => {
             if ('webkitCompassHeading' in e) {
               setHeading((e as any).webkitCompassHeading);
             }
          }, true);
        } else {
          setError("Izin sensor kompas ditolak.");
        }
      } catch (err) {
        setError("Gagal meminta izin kompas.");
      }
    }
  };

  const isAligned = heading !== null && qiblaBearing !== null && Math.abs(heading - qiblaBearing) < 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Arah Kiblat</h1>
          <p className="text-text-muted text-sm mt-1">Cari arah Kakbah</p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        {!isSupported && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-4 w-full">
            Maaf, perangkat atau peramban ini tidak memiliki sensor kompas yang diperlukan.
          </div>
        )}
        {error && (
          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium mb-4 w-full">
            {error}
          </div>
        )}

        {qiblaBearing !== null ? (
          <div className="mb-4">
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-2 justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4" />
              Sudut Kiblat: {Math.round(qiblaBearing)}°
            </span>
          </div>
        ) : (
           <p className="text-sm text-text-muted mb-4 animate-pulse">Menghitung arah Kiblat...</p>
        )}

        {typeof (DeviceOrientationEvent as any).requestPermission === 'function' && heading === null && (
          <button onClick={requestAccess} className="bg-primary text-white font-bold px-4 py-2 rounded-xl mb-4">
            Berikan Izin Sensor Kompas (iOS)
          </button>
        )}

        <div className={`relative w-64 h-64 mx-auto my-8 border-[6px] rounded-full flex items-center justify-center transition-colors duration-500 ${isAligned ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-gray-200'}`}>
           {/* Dial */}
           <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-400 font-bold text-sm">U</div>
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 font-bold text-sm">S</div>
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">B</div>
           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">T</div>
           
           {/* Compass Needle Container */}
           {heading !== null && (
             <div 
               className="absolute w-full h-full transition-transform duration-200 ease-out flex items-center justify-center"
               style={{ transform: `rotate(${-heading}deg)` }}
             >
                {/* Qibla Indicator (Kaaba) */}
                {qiblaBearing !== null && (
                  <div 
                    className="absolute w-full h-full flex flex-col justify-start items-center"
                    style={{ transform: `rotate(${qiblaBearing}deg)` }}
                  >
                     <div className="w-4 h-4 bg-primary rounded-full mt-2 ring-4 ring-white shadow-md z-10" />
                     <div className="w-1 h-20 bg-primary mt-1 opacity-50" />
                  </div>
                )}
                
                {/* Phone orientation needle */}
                <div className="absolute w-12 h-24 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[40px] border-b-gray-800" />
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[40px] border-t-gray-300" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full" />
                </div>
             </div>
           )}

           {heading === null && !error && (
             <Compass className="w-16 h-16 text-gray-300 animate-pulse" />
           )}
        </div>
        
        {isAligned && (
          <div className="text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl">
            Arah Sudah Tepat!
          </div>
        )}

        <p className="text-xs text-text-muted mt-6 max-w-sm">
          Akurasi kompas dipengaruhi oleh perangkat dan lingkungan sekitar. Jauhkan dari benda magnetis untuk hasil terbaik.
        </p>
      </div>
    </div>
  );
}
