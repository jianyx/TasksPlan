import { getMeteoconIcon, getWeatherLabel } from '@/lib/weather-map';

export type WeatherData = {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  icon: string;
  label: string;
};

// 通过 IP 获取城市名（不需要用户授权定位）
export async function getCityByIP(): Promise<{ city: string; lat: number; lon: number }> {
  try {
    const response = await fetch('http://localhost:3001/api/ip-location');
    const data = await response.json();
    console.log(data, 'IP 定位结果')
    if (data.status === 'success') {
      return { city: data.city, lat: data.lat, lon: data.lon };
    }
    throw new Error('定位失败');
  } catch (error) {
    console.error('获取城市失败:', error);
    return { city: '北京', lat: 39.9042, lon: 116.4074 }; // 默认值
  }
}

// 获取当前天气
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();

  const cw = data.current_weather;
  const weatherCode: number = cw.weathercode;
  const temperature: number = cw.temperature;

  // Open-Meteo 的 current_weather 不直接返回 is_day，用时间粗略判断
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  return {
    temperature,
    weatherCode,
    isDay,
    icon: getMeteoconIcon(weatherCode, isDay),
    label: getWeatherLabel(weatherCode),
  };
}

// 浏览器定位
export function getPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}

export async function getLocationByIP(): Promise<{ city: string; lat: number; lon: number }> {
  try {
    const res = await fetch('http://localhost:3001/api/ip-location');
    const data = await res.json();
    if (data.status === 'success') {
      return { city: data.city, lat: data.lat, lon: data.lon };
    }
    return { city: '北京', lat: 39.9042, lon: 116.4074 };
  } catch {
    return { city: '北京', lat: 39.9042, lon: 116.4074 };
  }
}