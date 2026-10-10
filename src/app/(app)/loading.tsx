export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-10 sm:px-8">
      <div className="h-10 w-2/3 rounded-xl bg-slate-100" />
      <div className="h-5 w-1/2 rounded-lg bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );
}
