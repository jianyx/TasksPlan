'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/layout/app-nav';
import { PageShell, PageBody } from '@/components/layout/page-shell';
import { SectionTitle } from '@/components/ui/section-title';
import { SkeletonLines } from '@/components/ui/skeleton-lines';
import { Checkbox } from '@/components/ui/checkbox';
import { getTaskDetail, updateTask, toggleSubtask, deleteTask } from '@/services/tasks';
import type { TaskDetail } from '@/types';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [todayStr, setTodayStr] = useState('');

  const load = useCallback(() => {
    return getTaskDetail(id)
      .then(data => {
        setTask(data);
        setEditTitle(data.title);
        setEditDesc(data.description || '');
        setEditStart(data.startDate);
        setEditEnd(data.endDate);
        // 随任务数据刷新日期快照，避免在 Effect 中同步更新状态。
        setTodayStr(new Date().toISOString().slice(0, 10));
      })
      .catch(() => {
        router.push('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  const toggleSub = async (subId: number, done: boolean) => {
    await toggleSubtask(subId, done);
    load();
  };

  const saveEdit = async () => {
    setError('');
    if (!editTitle.trim()) return setError('标题不能为空');
    if (editStart > editEnd) return setError('开始日期不能晚于结束日期');

    setSaving(true);
    try {
      await updateTask(id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        startDate: editStart,
        endDate: editEnd,
      });
      setEditing(false);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这个任务？所有子任务也会一并删除。')) return;
    try {
      await deleteTask(id);
      router.push('/');
    } catch (e: any) {
      setError(e.response?.data?.error || '删除失败');
    }
  };

  const grouped = useMemo(() => {
    if (!task) return [];
    const map = new Map<string, typeof task.subtasks>();
    for (const s of task.subtasks) {
      const key = String(s.scheduledDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [task]);

  const percent = task && task.total > 0 ? Math.round((task.done / task.total) * 100) : 0;

  const daysBetween = (a: string, b: string) =>
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;


  return (
    <PageShell>
      <AppNav items={[
        { href: '/', label: '今日' },
        { href: '/tasks/new', label: '新建' },
        { href: '/history', label: '历史' },
      ]} />

      {/* ===== header ===== */}
      <div className="bg-[#FAFAFA] dark:bg-[#080808] border-b border-[#E5E5E5] dark:border-[#1F1F1F]">
        <div className="max-w-6xl mx-auto px-8 pt-10 pb-12">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors"
            >
              ← 返回
            </Link>
            {task && (
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                task.status === 'completed'
                  ? 'bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A]'
                  : 'border border-[#E5E5E5] dark:border-[#1F1F1F] text-[#737373]'
              }`}>
                {task.status === 'completed' ? '已完成' : '进行中'}
              </span>
            )}
          </div>
          <h1 className="text-[32px] leading-tight font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            {loading ? '加载中' : task?.title}
          </h1>
          {task?.description && !editing && (
            <p className="text-[14px] text-[#737373] mt-3 max-w-2xl">{task.description}</p>
          )}
        </div>
      </div>

      <PageBody>
        {loading ? (
          <SkeletonLines count={5} />
        ) : !task ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* ===== 左栏：子任务列表 ===== */}
            <div className="lg:col-span-8">
              <SectionTitle count={task.total}>子任务安排</SectionTitle>

              {grouped.length === 0 ? (
                <p className="text-[14px] text-[#A3A3A3] py-8 text-center">没有子任务</p>
              ) : (
                <div className="space-y-8">
                  {grouped.map(([date, items]) => {
                    const dayDone = items.filter(i => i.done).length;
                    const isToday = date === todayStr;
                    return (
                      <div key={date}>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className={`text-[12px] font-mono ${
                            isToday ? 'text-[#0A0A0A] dark:text-white font-medium' : 'text-[#737373]'
                          }`}>
                            {date}{isToday && ' · 今天'}
                          </span>
                          <span className="text-[11px] text-[#A3A3A3] font-mono">
                            {dayDone}/{items.length}
                          </span>
                        </div>
                        <ul className="-mx-3">
                          {items.map(s => (
                            <li
                              key={s.id}
                              className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-white dark:hover:bg-[#141414] transition-colors"
                            >
                              <Checkbox
                                checked={s.done}
                                onCheckedChange={() => toggleSub(s.id, !s.done)}
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
            </div>

            {/* ===== 右栏 ===== */}
            <aside className="lg:col-span-4 space-y-10">

              {/* 进度 */}
              <section>
                <SectionTitle>进度</SectionTitle>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[28px] font-mono font-medium text-[#0A0A0A] dark:text-white tracking-tight">
                    {percent}%
                  </span>
                  <span className="text-[12px] text-[#737373] font-mono">
                    {task.done}/{task.total}
                  </span>
                </div>
                <div className="h-px bg-[#E5E5E5] dark:bg-[#1F1F1F] relative">
                  <div
                    className="h-px bg-[#0A0A0A] dark:bg-white transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </section>

              {/* 时间范围 */}
              <section>
                <SectionTitle>时间范围</SectionTitle>
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#737373]">开始</span>
                    <span className="font-mono text-[#0A0A0A] dark:text-white">{task.startDate}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#737373]">结束</span>
                    <span className="font-mono text-[#0A0A0A] dark:text-white">{task.endDate}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2.5 border-t border-[#E5E5E5] dark:border-[#1F1F1F]">
                    <span className="text-[#737373]">历时</span>
                    <span className="font-mono text-[#0A0A0A] dark:text-white">
                      {daysBetween(task.startDate, task.endDate)} 天
                    </span>
                  </div>
                </div>
              </section>

              {/* 操作 */}
              <section>
                <SectionTitle>操作</SectionTitle>
                {!editing ? (
                  <div className="space-y-1 -mx-3">
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full text-left text-[13px] text-[#0A0A0A] dark:text-white px-3 py-2 rounded-md hover:bg-white dark:hover:bg-[#141414] transition-colors"
                    >
                      编辑任务
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left text-[13px] text-[#737373] hover:text-red-500 px-3 py-2 rounded-md hover:bg-white dark:hover:bg-[#141414] transition-colors"
                    >
                      删除任务
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] text-[#737373] block mb-1">标题</label>
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-2 text-[14px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] text-[#737373] block mb-1">描述</label>
                      <input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-2 text-[14px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] text-[#737373] block mb-1">开始</label>
                        <input
                          type="date"
                          value={editStart}
                          onChange={e => setEditStart(e.target.value)}
                          className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-2 text-[13px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] text-[#737373] block mb-1">结束</label>
                        <input
                          type="date"
                          value={editEnd}
                          onChange={e => setEditEnd(e.target.value)}
                          className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-2 text-[13px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {error && <p className="text-[12px] text-red-500">{error}</p>}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] text-[13px] font-medium px-4 py-1.5 rounded-md hover:opacity-90 disabled:opacity-30 transition-opacity"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setError(''); }}
                        className="text-[13px] text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white px-3 py-1.5 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </section>

            </aside>
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}