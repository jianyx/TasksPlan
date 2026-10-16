import Link from 'next/link';

type Props = {
  title: string;
  hint?: string;
  cta?: { href: string; label: string };
};

export function EmptyState({ title, hint, cta }: Props) {
  return (
    <div className="py-16 text-center">
      <p className="text-[15px] text-[#A3A3A3]">{title}</p>
      {hint && <p className="text-[13px] text-[#A3A3A3] mt-2">{hint}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-6 text-[13px] text-[#0A0A0A] dark:text-white border-b border-[#0A0A0A] dark:border-white pb-0.5"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}