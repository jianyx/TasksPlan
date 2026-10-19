'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/layout/app-nav';
import { PageShell, PageBody } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionTitle } from '@/components/ui/section-title';
import { getUserProfile, updateWebhook, testNotify } from '@/services/user';

export default function SettingsPage() {
  const router = useRouter();
  const [webhook, setWebhook] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // 提示信息
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    getUserProfile()
      .then(data => {
        if (data.dingtalkWebhook) setWebhook(data.dingtalkWebhook);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setMsg(null);
    setSaving(true);
    try {
      await updateWebhook(webhook.trim());
      setMsg({ type: 'success', text: 'Webhook 地址已保存' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setMsg(null);
    if (!webhook.trim()) {
      return setMsg({ type: 'error', text: '请先保存 Webhook 地址' });
    }
    
    setTesting(true);
    try {
      const res = await testNotify();
      if (res.errcode === 0) {
        setMsg({ type: 'success', text: '测试消息已发送，请查看钉钉群' });
      } else {
        setMsg({ type: 'error', text: `发送失败: ${res.errmsg || '未知错误'}` });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || '发送失败' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageShell>
      <AppNav items={[
        { href: '/', label: '今日' },
        { href: '/tasks/new', label: '新建' },
        { href: '/history', label: '历史' },
        { href: '/settings', label: '设置', active: true },
      ]} />

      <PageHeader
        eyebrow="Settings"
        title="系统设置"
        description="配置你的钉钉机器人，每天早晨 8 点接收今日待办提醒。"
      />

      <PageBody>
        {loading ? (
          <div className="h-20 bg-[#E5E5E5] dark:bg-[#1F1F1F] rounded animate-pulse max-w-2xl" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* 左栏：表单 */}
            <div className="lg:col-span-8 max-w-2xl">
              <SectionTitle>钉钉机器人配置</SectionTitle>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[13px] text-[#737373] block mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="text"
                    value={webhook}
                    onChange={e => setWebhook(e.target.value)}
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                    className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#1F1F1F] py-3 text-[15px] text-[#0A0A0A] dark:text-white placeholder:text-[#A3A3A3] focus:border-[#0A0A0A] dark:focus:border-white outline-none transition-colors"
                  />
                </div>

                {msg && (
                  <div className={`text-[13px] px-4 py-3 border-l-2 ${
                    msg.type === 'success' 
                      ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30' 
                      : 'border-red-500 text-red-700 bg-red-50 dark:bg-red-950/30'
                  }`}>
                    {msg.text}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] text-[14px] font-medium px-6 py-2.5 rounded-md hover:opacity-90 disabled:opacity-30 transition-opacity"
                  >
                    {saving ? '保存中...' : '保存配置'}
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={testing || saving}
                    className="border border-[#E5E5E5] dark:border-[#333] text-[#0A0A0A] dark:text-white text-[14px] font-medium px-6 py-2.5 rounded-md hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] disabled:opacity-30 transition-colors"
                  >
                    {testing ? '发送中...' : '发送测试消息'}
                  </button>
                </div>
              </div>
            </div>

            {/* 右栏：帮助说明 */}
            <aside className="lg:col-span-4 space-y-8">
              <section>
                <SectionTitle>如何获取 Webhook？</SectionTitle>
                <ol className="text-[13px] text-[#737373] leading-loose list-decimal list-inside space-y-1">
                  <li>打开钉钉，进入一个群聊</li>
                  <li>点击右上角「群设置」</li>
                  <li>找到「智能群助手」</li>
                  <li>添加机器人 → 自定义</li>
                  <li>安全设置勾选「自定义关键词」</li>
                  <li>关键词填写：<strong className="text-[#0A0A0A] dark:text-white">待办</strong></li>
                  <li>复制生成的 Webhook 地址填入左侧</li>
                </ol>
              </section>
            </aside>

          </div>
        )}
      </PageBody>
    </PageShell>
  );
}