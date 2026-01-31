import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card rounded-xl p-6', className)}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="h-8 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card rounded-xl p-6', className)}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-white/10 rounded w-16"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
        </div>
        <div className="h-64 bg-white/5 rounded"></div>
      </div>
    </div>
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-lg p-4', className)}>
      <div className="animate-pulse">
        <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
        <div className="h-6 bg-white/10 rounded w-16"></div>
      </div>
    </div>
  );
}
