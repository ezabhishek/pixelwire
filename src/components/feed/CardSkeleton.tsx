export function CardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <div className="skeleton h-5 w-10" />
        <div className="skeleton size-[18px] rounded-full" />
        <div className="skeleton h-3 w-24" />
      </div>
      <div className="skeleton mt-4 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-4/5" />
      <div className="skeleton mt-2 h-4 w-3/5" />
      <div className="mt-4 flex gap-1.5">
        <div className="skeleton h-6 w-14" />
        <div className="skeleton h-6 w-16" />
      </div>
      <div className="skeleton mt-4 aspect-[2/1] w-full rounded-xl" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-7 w-14" />
        <div className="skeleton h-7 w-12" />
        <div className="flex-1" />
        <div className="skeleton h-7 w-8" />
        <div className="skeleton h-7 w-8" />
      </div>
    </div>
  );
}
