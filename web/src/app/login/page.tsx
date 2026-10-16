'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, register } from '@/services/auth';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (mode: 'login' | 'register') => {
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const res = await fn(email, password);
      localStorage.setItem('token', res.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ===== 左侧品牌区（跟随主题） ===== */}
      <div className="hidden lg:flex lg:w-[45%] bg-white dark:bg-[#0F1115] border-r border-slate-200 dark:border-transparent relative">
        <div className="flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 dark:text-white">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-slate-900 dark:text-white text-[15px] font-medium tracking-wide">
              任务规划系统
            </span>
          </div>

          <div className="space-y-5 max-w-sm">
            <h1 className="text-slate-900 dark:text-white text-[28px] leading-snug font-medium">
              把长期目标，拆成<br />每天能完成的事
            </h1>
            <p className="text-slate-500 dark:text-[#8B8F96] text-[15px] leading-relaxed">
              设定任务的起止日期，系统自动生成每日待办。所有子任务完成后，主任务归档到历史。
            </p>
          </div>

          <div className="flex items-center gap-3 text-[13px] text-slate-400 dark:text-[#5A5F66]">
            <span>每日钉钉提醒</span>
            <span className="w-px h-3 bg-slate-200 dark:bg-[#2A2D33]" />
            <span>AI 智能拆解</span>
            <span className="w-px h-3 bg-slate-200 dark:bg-[#2A2D33]" />
            <span>进度归档</span>
          </div>
        </div>
      </div>

      {/* ===== 右侧表单区（强制亮色，不随主题变化） ===== */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white text-slate-900 relative">
        {/* 右上角主题切换 */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-slate-900 text-[15px] font-medium tracking-wide">任务规划系统</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">欢迎回来</h2>
            <p className="text-sm text-slate-500">登录后管理你的任务与今日待办</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-900">邮箱</Label>
              <Input
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button className="w-full" onClick={() => handle('login')} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">还没有账号</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full bg-white text-slate-900 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => handle('register')}
              disabled={loading}
            >
              注册新账号
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-8">
            登录即表示你同意使用本系统管理个人任务
          </p>
        </div>
      </div>
    </div>
  );
}