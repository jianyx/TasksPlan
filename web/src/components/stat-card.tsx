import { Card, CardContent } from '@/components/ui/card';

type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: 'indigo' | 'emerald' | 'amber' | 'blue';
};

const accentMap = {
  indigo: 'text-indigo-600 dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

export function StatCard({ label, value, hint, accent = 'indigo' }: Props) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        <div className={`text-2xl font-semibold font-mono tracking-tight ${accentMap[accent]}`}>
          {value}
        </div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}