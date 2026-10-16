'use client';
import { useEffect, useState } from 'react';
import { WeatherAnimation } from './weather-animation';
import {
  getCurrentWeather,
  getPosition,
  getLocationByIP,
  type WeatherData,
} from '@/services/weather';

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const loc = await getLocationByIP();
      if (cancelled) return;
      setCity(loc.city);

      let lat = loc.lat;
      let lon = loc.lon;
      try {
        const pos = await getPosition();
        lat = pos.lat;
        lon = pos.lon;
      } catch {}

      try {
        const data = await getCurrentWeather(lat, lon);
        if (!cancelled) {
          setWeather(data);
          setStatus('ready');
        }
      } catch (e) {
        console.error('天气获取失败:', e);
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#E5E5E5] dark:bg-[#1F1F1F] animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-16 bg-[#E5E5E5] dark:bg-[#1F1F1F] rounded animate-pulse" />
          <div className="h-3 w-24 bg-[#E5E5E5] dark:bg-[#1F1F1F] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !weather) return null;

  return (
    <div className="flex items-center gap-5">
      <WeatherAnimation iconName={weather.icon} size={72} />
      <div>
        <p className="text-[36px] font-mono font-medium text-[#0A0A0A] dark:text-white tracking-tight leading-none">
          {Math.round(weather.temperature)}°
        </p>
        <p className="text-[13px] text-[#737373] mt-2 whitespace-nowrap">
          {city} · {weather.label}
        </p>
      </div>
    </div>
  );
}