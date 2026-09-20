import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}
