type Props = {
  children: React.ReactNode;
};

export function PageShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0A0A0A]">
      {children}
    </div>
  );
}

export function PageBody({ children }: Props) {
  return (
    <main className="max-w-6xl mx-auto px-8 py-12">
      {children}
    </main>
  );
}