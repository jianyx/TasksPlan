type Props = {
  children: React.ReactNode;
  count?: number;
};

export function SectionTitle({ children, count }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[#A3A3A3] font-medium">
        {children}
      </h2>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-[#A3A3A3] font-mono">{count}</span>
      )}
    </div>
  );
}