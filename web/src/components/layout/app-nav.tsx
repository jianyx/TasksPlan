'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

type NavItem = { href: string; label: string; active?: boolean };

type Props = {
  items: NavItem[];
};

export function AppNav({ items }: Props) {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-white dark:bg-[#0F0F0F] border-b border-[#EAEAEA] dark:border-[#1F1F1F]">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[14px] font-medium text-[#0A0A0A] dark:text-white tracking-tight"
        >
          任务规划
        </Link>
        <div className="flex items-center gap-0.5">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] px-2.5 py-1 rounded transition-colors ${
                item.active
                  ? 'text-[#0A0A0A] dark:text-white'
                  : 'text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-[13px] text-[#737373] hover:text-[#0A0A0A] dark:hover:text-white px-2.5 py-1 rounded transition-colors"
          >
            退出
          </button>
        </div>
      </div>
    </nav>
  );
}