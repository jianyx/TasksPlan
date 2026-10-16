type Props = {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  right?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, right }: Props) {
  return (
    <div className="bg-[#FAFAFA] dark:bg-[#080808] border-b border-[#E5E5E5] dark:border-[#1F1F1F]">
      <div className="max-w-6xl mx-auto px-8 pt-10 pb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] mb-3">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[32px] leading-tight font-medium tracking-tight text-[#0A0A0A] dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] text-[#737373] mt-3 max-w-xl">{description}</p>
          )}
        </div>
        {right && <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">{right}</div>}
      </div>
    </div>
  );
}