// WMO 天气代码 → Meteocons 图标名
export function getMeteoconIcon(code: number, isDay: boolean): string {
  switch (code) {
    case 0: return isDay ? 'clear-day' : 'clear-night';
    case 1: return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
    case 2: return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
    case 3: return 'overcast';
    case 45: return isDay ? 'fog-day' : 'fog-night';
    case 48: return isDay ? 'fog-day' : 'fog-night';
    case 51: case 53: case 55: return 'drizzle';
    case 56: case 57: case 66: case 67: return 'sleet';
    case 61: case 63: case 65: case 80: case 81: case 82: return 'rain';
    case 71: case 73: case 75: case 77: case 85: case 86: return 'snow';
    case 95: return 'thunderstorms';
    case 96: case 99: return 'thunderstorms-extreme';
    default: return isDay ? 'clear-day' : 'clear-night';
  }
}

// WMO 天气代码 → 中文描述
export function getWeatherLabel(code: number): string {
  if (code === 0) return '晴';
  if (code === 1 || code === 2) return '多云';
  if (code === 3) return '阴';
  if (code === 45 || code === 48) return '雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code >= 61 && code <= 67) return '雨';
  if (code >= 71 && code <= 77) return '雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 85 && code <= 86) return '阵雪';
  if (code === 95) return '雷暴';
  if (code === 96 || code === 99) return '雷暴伴冰雹';
  return '未知';
}