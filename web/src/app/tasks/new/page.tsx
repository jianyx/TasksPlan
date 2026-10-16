'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, aiPlanTask } from '@/services/tasks';

import { AppNav } from '@/components/layout/app-nav';
import { PageShell, PageBody } from '@/components/layout/page-shell';
import { SectionTitle } from '@/components/ui/section-title';

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewTaskPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => toDateString(new Date()));
  const [endDate, setEndDate] = useState(() => toDateString(new Date(Date.now() + 7 * 86400000)));
  const [items, setItems] = useState<string[]>(['']);
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // 计算预览
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) return 0;
    return Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [startDate, endDate]);

  const validItems = items.filter(i => i.trim()).length;
  const totalSubtasks = days * validItems;

  const updateItem = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    setItems(next);
  };
  const addItem = () => setItems([...items, '']);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError('');
    const daily = items.map(s => s.trim()).filter(Boolean);
    if (!title.trim()) return setError('请输入任务标题');
    if (daily.length === 0) return setError('至少需要一条每日子任务');
    if (startDate > endDate) return setError('开始日期不能晚于结束日期');

    setLoading(true);
    try {
      await createTask({ title, description, startDate, endDate, dailySubtasks: daily });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAiPlan = async () => {
    if (!goal.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const plan = await aiPlanTask(goal);
      setTitle(goal);
      setStartDate(plan.startDate);
      setEndDate(plan.endDate);
      setItems(plan.dailySubtasks);
      setMode('manual');
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI 规划失败');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PageShell>

      {/* ===== nav ===== */}
      <AppNav items={[{ href: '/', label: '今日', active: true }, { href: '/tasks/new', label: '新建' }, { href: '/history', label: '历史' }]} />

      {/* ===== 主体 ===== */}
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ===== 左栏：表单 ===== */}
          <div className="lg:col-span-8">

            {/* 模式切换 */}
            <div className="flex items-center gap-8 border-b border-[#E5E5E5] dark:border-[#1F1F1F] mb-12">
              <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>
                手动填写
              </TabButton>
              <TabButton active={mode === 'ai'} onClick={() => setMode('ai')}>
                AI 拆解
              </TabButton>
            </div>

            {error && (
              <div className="mb-8 px-4 py-3 border-l-2 border-[#0A0A0A] dark:border-white bg-white dark:bg-[#0F0F0F]">
                <p className="text-[13px] text-[#0A0A0A] dark:text-white">{error}</p>
              </div>
            )}

            {mode === 'ai' ? (
              /* ========== AI 模式 ========== */
              <div className="space-y-10">
                <Step n="01" title="描述你的目标">
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="例如：准备系统架构师考试，三个月内完成"
                    rows={4}
                    className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[16px] text-[#0A0A0A] dark:text-white placeholder:text-[#A3A3A3] focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors resize-none"
                  />
                  <p className="text-[12px] text-[#A3A3A3] mt-3">
                    AI 会根据目标建议时间范围，并拆解出每天要执行的子任务。结果可以直接修改。
                  </p>
                </Step>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleAiPlan}
                    disabled={aiLoading || !goal.trim()}
                    className="bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] text-[14px] font-medium px-6 py-2.5 rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    {aiLoading ? '生成中...' : '生成计划'}
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className="text-[14px] text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white px-3 py-2.5 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              /* ========== 手动模式 ========== */
              <div className="space-y-12">

                <Step n="01" title="基本信息">
                  <div className="space-y-6">
                    <Field label="任务标题">
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="例如：学习 AI 应用开发"
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[16px] text-[#0A0A0A] dark:text-white placeholder:text-[#A3A3A3] focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors"
                      />
                    </Field>

                    <Field label="描述" hint="可选">
                      <input
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="这个任务想要达成什么"
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[16px] text-[#0A0A0A] dark:text-white placeholder:text-[#A3A3A3] focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors"
                      />
                    </Field>
                  </div>
                </Step>

                <Step n="02" title="时间范围">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="开始日期">
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[16px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </Field>
                    <Field label="结束日期">
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[16px] text-[#0A0A0A] dark:text-white focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </Field>
                  </div>
                  {days > 0 && (
                    <p className="text-[12px] text-[#A3A3A3] mt-4 font-mono">
                      跨 {days} 天
                    </p>
                  )}
                </Step>

                <Step n="03" title="每日子任务">
                  <p className="text-[13px] text-[#737373] mb-5">
                    这些子任务会被复制到时间范围内的每一天，每天都会出现在今日待办里。
                  </p>

                  <div className="space-y-0">
                    {items.map((it, i) => (
                      <div
                        key={i}
                        className="group flex items-center gap-4 py-3 border-b border-[#E5E5E5] dark:border-[#1F1F1F]"
                      >
                        <span className="text-[11px] text-[#A3A3A3] font-mono w-7 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <input
                          value={it}
                          onChange={e => updateItem(i, e.target.value)}
                          placeholder="要做什么"
                          className="flex-1 bg-transparent text-[15px] text-[#0A0A0A] dark:text-white placeholder:text-[#A3A3A3] outline-none"
                        />
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(i)}
                            className="text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white text-[18px] leading-none opacity-0 group-hover:opacity-100 transition-opacity px-2"
                            aria-label="删除"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addItem}
                    className="mt-5 text-[13px] text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-[16px] leading-none">+</span>
                    添加一条
                  </button>
                </Step>

                <div className="flex items-center gap-3 pt-6 border-t border-[#E5E5E5] dark:border-[#1F1F1F]">
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] text-[14px] font-medium px-6 py-2.5 rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? '创建中...' : '创建任务'}
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="text-[14px] text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white px-3 py-2.5 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== 右栏：预览 / 说明 ===== */}
          <aside className="lg:col-span-4 space-y-10">
            <section>
              <SectionTitle>预览</SectionTitle>
              <div className="space-y-3 pt-1">
                <PreviewRow label="时间跨度" value={days > 0 ? `${days} 天` : '—'} />
                <PreviewRow label="每日子任务" value={validItems > 0 ? `${validItems} 条` : '—'} />
                <div className="pt-3 mt-3 border-t border-[#E5E5E5] dark:border-[#1F1F1F]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-[#737373]">将生成</span>
                    <span className="text-[22px] font-mono font-semibold text-[#0A0A0A] dark:text-white tracking-tight">
                      {totalSubtasks}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] text-right">条子任务</p>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>说明</SectionTitle>
              <ul className="space-y-3 text-[13px] text-[#737373] leading-relaxed">
                <li>· 每日子任务会被复制到时间范围内的每一天</li>
                <li>· 子任务可以在首页的今日待办里勾选完成</li>
                <li>· 所有子任务完成后主任务自动归档</li>
                <li>· 每天早上 8 点会推送到钉钉</li>
              </ul>
            </section>
          </aside>

        </div>
      </PageBody>
    </PageShell>
  );
}

/* ================= 辅助组件 ================= */

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 -mb-px text-[14px] border-b-2 transition-colors ${
        active
          ? 'border-[#0A0A0A] dark:border-white text-[#0A0A0A] dark:text-white font-medium'
          : 'border-transparent text-[#A3A3A3] hover:text-[#737373]'
      }`}
    >
      {children}
    </button>
  );
}

function Step({
  n, title, children,
}: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-6">
      <div className="pt-1">
        <span className="text-[11px] font-mono text-[#A3A3A3] tracking-wider">{n}</span>
      </div>
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] font-medium mb-5">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <label className="text-[12px] text-[#737373]">{label}</label>
        {hint && <span className="text-[11px] text-[#A3A3A3]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12px] text-[#737373]">{label}</span>
      <span className="text-[14px] font-mono text-[#0A0A0A] dark:text-white">{value}</span>
    </div>
  );
}