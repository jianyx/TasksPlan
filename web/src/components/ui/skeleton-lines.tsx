type Props = {
  count: number;
};

export function SkeletonLines({ count }: Props) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[#E5E5E5] dark:bg-[#1F1F1F] rounded animate-pulse"
        />
      ))}
    </div>
  );
}