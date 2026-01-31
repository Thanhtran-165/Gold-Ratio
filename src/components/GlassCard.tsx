import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function GlassCard({ children, className, onClick, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-6',
        hover && 'cursor-pointer',
        onClick && 'transition-all duration-300',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
