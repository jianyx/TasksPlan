// 展开日期区间，返回 YYYY-MM-DD 数组
export function eachDay(start: string, end: string): string[] {
  const days: string[] = []; // 保存区间内每天的日期字符串。
  const cur = new Date(start + 'T00:00:00'); // 将开始日期转为本地时区当天零点。
  const last = new Date(end + 'T00:00:00'); // 将结束日期转为本地时区当天零点。
  while (cur <= last) { // 逐天遍历，包含开始和结束日期。
    days.push(fmtDate(cur)); // 将当前日期格式化后加入数组。
    cur.setDate(cur.getDate() + 1); // 前进一天，自动处理跨月和跨年。
  }
  return days;
}

// Date → YYYY-MM-DD
export function fmtDate(d: Date): string {
  const y = d.getFullYear(); // 按本地时区获取年份。
  const m = String(d.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需加 1 并补齐两位。
  const day = String(d.getDate()).padStart(2, '0'); // 获取几号，不足两位时在前面补 0。
  return `${y}-${m}-${day}`;
}

// 今天 YYYY-MM-DD
export function today(): string {
  return fmtDate(new Date()); // 获取当前时间，返回本地时区今天的日期字符串。
}