'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHistoryTasks } from '@/services/tasks';
import type { Task } from '@/types';

import { AppNav } from '@/components/layout/app-nav';
import { PageShell, PageBody } from '@/components/layout/page-shell';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonLines } from '@/components/ui/skeleton-lines';
import { EmptyState } from '@/components/ui/empty-state';


export default function HistoryPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    getHistoryTasks()
      .then(historyTasks => {
        // 数据加载成功时记录时间快照，统计与分组共用该时间。
        setLoadedAt(new Date());
        setTasks(historyTasks);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // 本月完成数由任务和时间快照派生，无需额外的 state 与 Effect。
  const thisMonthCount = useMemo(() => {
    if (!loadedAt) return 0;
    return tasks.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d.getFullYear() === loadedAt.getFullYear() && d.getMonth() === loadedAt.getMonth();
    }).length;
  }, [tasks, loadedAt]);

  // ===== 按完成月份分组 =====
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!loadedAt) return Array.from(map.entries());
    for (const t of tasks) {
      const d = t.completedAt ? new Date(t.completedAt) : loadedAt;
      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [tasks, loadedAt]);

  // ===== 统计 =====
  const totalTasks = tasks.length;
  const totalSubtasks = tasks.reduce((sum, t) => sum + t.total, 0);

  const formatDate = (s: string | null) => {
    if (!s) return '';
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const daysBetween = (a: string, b: string) => {
    return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
  };

  return (
    <PageShell>

      {/* ===== nav ===== */}
      <AppNav items={[{ href: '/', label: '今日', active: true }, { href: '/tasks/new', label: '新建' }, { href: '/settings', label: '设置' }]} />

      {/* ===== 主体 ===== */}
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ===== 左栏：任务列表 ===== */}
          <div className="lg:col-span-8">
            {loading ? (
              <SkeletonLines count={4} />
            ) : tasks.length === 0 ? (
              <EmptyState
                title="还没有完成的任务"
                hint="完成第一个任务后，它会出现在这里"
                cta={{ href: '/tasks/new', label: '去创建任务' }}
              />
            ) : (
              <div className="space-y-14">
                {grouped.map(([month, items]) => (
                  <section key={month}>
                    <div className="flex items-baseline justify-between mb-6">
                      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] font-medium">
                        {month}
                      </h2>
                      <span className="text-[11px] text-[#A3A3A3] font-mono">
                        {items.length} 个
                      </span>
                    </div>

                    <ul>
                      {items.map(t => {
                        const span = daysBetween(t.startDate, t.endDate);
                        return (
                          <li
                            key={t.id}
                            className="py-5 border-b border-[#E5E5E5] dark:border-[#1F1F1F] last:border-b-0"
                          >
                            <div className="flex items-baseline justify-between gap-4 mb-2">
                              <span className="text-[16px] text-[#0A0A0A] dark:text-white truncate">
                                {t.title}
                              </span>
                              <span className="text-[12px] text-[#A3A3A3] font-mono whitespace-nowrap">
                                {formatDate(t.completedAt)}
                              </span>
                            </div>

                            {t.description && (
                              <p className="text-[13px] text-[#737373] mb-2 truncate">
                                {t.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[#A3A3A3]">
                              <span className="font-mono">
                                {t.startDate} — {t.endDate}
                              </span>
                              <span>·</span>
                              <span>历时 {span} 天</span>
                              <span>·</span>
                              <span>{t.total} 条子任务全部完成</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>

          {/* ===== 右栏：统计 ===== */}
          <aside className="lg:col-span-4 space-y-10">
            {!loading && totalTasks > 0 && (
              <>
                <section>
                  <SectionTitle>归档概览</SectionTitle>
                  <div className="space-y-4">
                    <StatRow label="已完成任务" value={totalTasks} />
                    <StatRow label="累计子任务" value={totalSubtasks} />
                    <StatRow label="本月完成" value={thisMonthCount} />
                    <StatRow
                      label="平均每条"
                      value={totalTasks > 0 ? Math.round(totalSubtasks / totalTasks) : 0}
                      suffix="条子任务"
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>说明</SectionTitle>
                  <p className="text-[13px] text-[#737373] leading-relaxed">
                    当一个主任务的所有子任务都完成时，它会自动归档到这里。归档数据不会被删除，可以随时查看。
                  </p>
                </section>
              </>
            )}
          </aside>

        </div>
      </PageBody>
    </PageShell>
  );
}

/* ================= 辅助组件 ================= */
function StatRow({
  label, value, suffix,
}: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[13px] text-[#737373]">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[18px] font-mono font-semibold text-[#0A0A0A] dark:text-white tracking-tight">
          {value}
        </span>
        {suffix && <span className="text-[11px] text-[#A3A3A3]">{suffix}</span>}
      </div>
    </div>
  );
}

// function Empty() {
//   return (
//     <div className="py-20 text-center">
//       <p className="text-[15px] text-[#A3A3A3]">还没有完成的任务</p>
//       <p className="text-[13px] text-[#A3A3A3] mt-2">
//         完成第一个任务后，它会出现在这里
//       </p>
//       <Link
//         href="/tasks/new"
//         className="inline-block mt-6 text-[13px] text-[#0A0A0A] dark:text-white border-b border-[#0A0A0A] dark:border-white pb-0.5"
//       >
//         去创建任务 →
//       </Link>
//     </div>
//   );
// }