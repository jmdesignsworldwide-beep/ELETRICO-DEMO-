export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-8 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton mb-3 h-11 w-11 rounded-xl" />
            <div className="skeleton mb-2 h-8 w-24" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card flex items-center gap-4 p-4">
            <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
            <div className="skeleton h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
