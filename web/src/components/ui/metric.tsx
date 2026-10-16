type Props = {
  label: string;
  value: string;
};

export function Metric({ label, value }: Props) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[12px] text-[#A3A3A3]">{label}</span>
      <span className="font-mono text-[15px] text-[#0A0A0A] dark:text-white tracking-tight">
        {value}
      </span>
    </div>
  );
}