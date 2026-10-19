'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { WeatherWidget } from '@/components/weather-widget';
import { getTodaySubtasks, getTasks, getStatsOverview, toggleSubtask } from '@/services/tasks';
import type { Subtask, Task, StatsOverview } from '@/types';

import { AppNav } from '@/components/layout/app-nav';
import { PageShell, PageBody } from '@/components/layout/page-shell';
import { SectionTitle } from '@/components/ui/section-title';
import { Metric } from '@/components/ui/metric';
import { SkeletonLines } from '@/components/ui/skeleton-lines';
import { EmptyState } from '@/components/ui/empty-state';

import { WeekHeatmap } from '@/components/week-heatmap';
import { getWeekStats } from '@/services/tasks';
import type { WeekStat } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subtask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStat[]>([]);

  const load = useCallback(() => {
    return Promise.all([
      getTodaySubtasks(),
      getTasks(),
      getStatsOverview(),
      getWeekStats(),
    ])
      .then(([s, t, st, ws]) => {
        setSubs(s);
        setTasks(t);
        setStats(st);
        setWeekStats(ws);
        setNow(Date.now());
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  const toggle = async (s: Subtask) => {
    await toggleSubtask(s.id, !s.done);
    load();
  };

  const dateStr = now === null ? '' : new Date(now).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const undoneCount = subs.filter(s => !s.done).length;

  const headline = (() => {
    if (loading) return '加载中';
    if (subs.length === 0) return '今天没有安排';
    if (undoneCount === 0) return '今天全部完成';
    return `今天还有 ${undoneCount} 件事没做`;
  })();

  // 今日待办按主任务分组
  const grouped = subs.reduce((acc, s) => {
    const key = s.taskTitle || '未分组';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, Subtask[]>);

  return (
    <PageShell>
      {/* ===== 白色头部区（导航 + 标题） ===== */}
      <AppNav items={[{ href: '/', label: '今日', active: true }, { href: '/tasks/new', label: '新建' }, { href: '/history', label: '历史' }, { href: '/settings', label: '设置' }]} />
        <div className="bg-[#FAFAFA] dark:bg-[#080808] border-b border-[#E5E5E5] dark:border-[#1F1F1F]">
          <div className="max-w-6xl mx-auto px-8 pt-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

              {/* 左侧：日期 + 标题 + 指标 */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] mb-3">
                  {dateStr}
                </p>
                <h1 className="text-[32px] leading-tight font-medium tracking-tight text-[#0A0A0A] dark:text-white mb-6">
                  {headline}
                </h1>
                {stats && (
                  <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <Metric label="今日" value={`${stats.todayDone}/${stats.todayTotal}`} />
                    <Metric label="本周" value={`${stats.weekDone}/${stats.weekTotal}`} />
                    <Metric label="连续" value={`${stats.streak} 天`} />
                    <Metric label="进行中" value={`${stats.activeTasks}`} />
                  </div>
                )}
              </div>

              {/* 右侧：天气 */}
              <div className="shrink-0">
                <WeatherWidget />
              </div>

            </div>
          </div>
        </div>

      {/* ===== 灰色主体区 ===== */}
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ===== 左栏：主内容 ===== */}
          <div className="lg:col-span-8 space-y-14">

            {/* 今日待办 */}
            <section>
              <SectionTitle count={subs.length}>今日待办</SectionTitle>
              {loading ? (
                <SkeletonLines count={3} />
              ) : subs.length === 0 ? (
                <EmptyState title="今天没有安排" hint="要不要创建一个新任务？" />
              ) : (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([taskTitle, items]) => {
                    const doneCount = items.filter(i => i.done).length;
                    return (
                      <div key={taskTitle}>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-[12px] text-[#737373]">{taskTitle}</span>
                          <span className="text-[11px] text-[#A3A3A3] font-mono">
                            {doneCount}/{items.length}
                          </span>
                        </div>
                        <ul className="space-y-0.5 -mx-3">
                          {items.map(s => (
                            <li
                              key={s.id}
                              className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-white dark:hover:bg-[#141414] transition-colors"
                            >
                              <Checkbox
                                checked={s.done}
                                onCheckedChange={() => toggle(s)}
                                className="mt-0.5"
                              />
                              <p className={
                                s.done
                                  ? 'text-[15px] text-[#A3A3A3] line-through flex-1'
                                  : 'text-[15px] text-[#0A0A0A] dark:text-white flex-1'
                              }>
                                {s.title}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 进行中的任务 */}
            <section>
              <SectionTitle count={tasks.length}>进行中的任务</SectionTitle>
              {loading || now === null ? (
                <SkeletonLines count={2} />
              ) : tasks.length === 0 ? (
                <EmptyState title="还没有进行中的任务" />
              ) : (
                <ul className="space-y-8">
                  {tasks.map(t => {
                    const percent = t.total ? Math.round((t.done / t.total) * 100) : 0;
                    const daysLeft = Math.ceil(
                      (new Date(t.endDate).getTime() - now) / 86400000
                    );
                    const dayLabel =
                      daysLeft < 0 ? `已超期 ${Math.abs(daysLeft)} 天`
                      : daysLeft === 0 ? '今天截止'
                      : `剩 ${daysLeft} 天`;
                    const isLate = daysLeft < 0;
                    return (
                      <li key={t.id}>
                        <Link href={`/tasks/${t.id}`} className="block group">
                          <div className="flex items-baseline justify-between gap-4 mb-1">
                            <span className="text-[15px] text-[#0A0A0A] dark:text-white truncate">
                              {t.title}
                            </span>
                            <span className={`text-[12px] font-mono whitespace-nowrap ${
                              isLate ? 'text-[#0A0A0A] dark:text-white' : 'text-[#737373]'
                            }`}>
                              {dayLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[12px] text-[#A3A3A3]">
                              {t.startDate} — {t.endDate}
                            </span>
                            <span className="text-[12px] text-[#737373] font-mono">
                              {t.done}/{t.total}
                            </span>
                          </div>
                          <div className="h-px bg-[#E5E5E5] dark:bg-[#1F1F1F] relative">
                            <div
                              className="h-px bg-[#0A0A0A] dark:bg-white transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ===== 右栏：辅助信息 ===== */}
          <aside className="lg:col-span-4 space-y-10">
            <section>
              <SectionTitle>本周热力图</SectionTitle>
              {loading ? (
                <div className="h-20 bg-[#E5E5E5] dark:bg-[#1F1F1F] rounded animate-pulse" />
              ) : weekStats.length > 0 ? (
                <WeekHeatmap data={weekStats} />
              ) : (
                <p className="text-[13px] text-[#A3A3A3]">暂无数据</p>
              )}
            </section>

            <section>
              <SectionTitle>快捷操作</SectionTitle>
              <ul className="space-y-1 -mx-3">
                <QuickLink href="/tasks/new" label="新建任务" hint="手动或 AI 拆解" />
                <QuickLink href="/history" label="历史归档" hint="查看已完成" />
              </ul>
            </section>

            <section>
              <SectionTitle>提示</SectionTitle>
              <p className="text-[13px] text-[#737373] leading-relaxed">
                每天早上 8 点，系统会将今日待办推送到钉钉。配置入口在历史归档页。
              </p>
            </section>
          </aside>

        </div>
      </PageBody>
    </PageShell>
  );
}

/* ================= 辅助组件 ================= */

function ProgressRow({ label, done, total }: { label: string; done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12px] text-[#737373]">{label}</span>
        <span className="text-[12px] text-[#A3A3A3] font-mono">{percent}%</span>
      </div>
      <div className="h-px bg-[#E5E5E5] dark:bg-[#1F1F1F] relative">
        <div
          className="h-px bg-[#0A0A0A] dark:bg-white transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between px-3 py-2.5 rounded-md hover:bg-white dark:hover:bg-[#141414] transition-colors"
      >
        <span className="text-[14px] text-[#0A0A0A] dark:text-white">{label}</span>
        <span className="text-[12px] text-[#A3A3A3]">{hint}</span>
      </Link>
    </li>
  );
}