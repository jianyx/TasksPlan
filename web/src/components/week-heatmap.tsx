import type { WeekStat } from '@/types';

type Props = {
  data: WeekStat[];
};

// 判断完成率对应的色阶（淡黄 -> 深红）
function getColorClass(done: number, total: number) {
  // 1. 没有安排任务：极浅的底色
  if (total === 0) return 'bg-[#F0F0F0] dark:bg-[#1A1A1A]';
  
  const ratio = done / total;
  
  // 2. 有任务但一个都没做：淡黄色
  if (ratio === 0) return 'bg-[#FEF08A] dark:bg-[#423600]'; 
  
  // 3. 完成了一部分（<50%）：明黄色
  if (ratio < 0.5) return 'bg-[#FDE047] dark:bg-[#854D0E]';
  
  // 4. 完成了大部分（<100%）：橙色
  if (ratio < 1) return 'bg-[#F97316] dark:bg-[#C2410C]';
  
  // 5. 全部完成（100%）：深红色
  return 'bg-[#DC2626] dark:bg-[#EF4444]';
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

export function WeekHeatmap({ data }: Props) {
  // 获取今天日期格式（YYYY-MM-DD），用于判断今天
  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <div>
      {/* 方块矩阵 */}
      <div className="flex justify-between gap-1.5 mb-2">
        {data.map((d, i) => {
          const isToday = d.date === todayStr;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full aspect-square rounded-sm transition-colors ${getColorClass(d.done, d.total)} ${
                  isToday ? 'ring-1 ring-offset-2 ring-[#0A0A0A] dark:ring-white dark:ring-offset-[#0A0A0A]' : ''
                }`}
                title={`${d.date}：${d.total === 0 ? '无任务' : `${d.done}/${d.total} 完成`}`}
              />
              <span className="text-[10px] text-[#A3A3A3] font-mono">{weekDays[i]}</span>
            </div>
          );
        })}
      </div>
      
      {/* 图例 */}
      <div className="flex items-center justify-end gap-1.5 mt-4">
        <span className="text-[10px] text-[#A3A3A3] mr-1">少</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-[#FEF08A] dark:bg-[#423600]" />
        <div className="w-2.5 h-2.5 rounded-sm bg-[#FDE047] dark:bg-[#854D0E]" />
        <div className="w-2.5 h-2.5 rounded-sm bg-[#F97316] dark:bg-[#C2410C]" />
        <div className="w-2.5 h-2.5 rounded-sm bg-[#DC2626] dark:bg-[#EF4444]" />
        <span className="text-[10px] text-[#A3A3A3] ml-1">多</span>
      </div>
    </div>
  );
}