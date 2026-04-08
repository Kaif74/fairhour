import React from 'react';

interface CredibilityPillsProps {
  declaredLevel: 'beginner' | 'intermediate' | 'expert';
  badge: string;
  credibilityScore?: number;
  compact?: boolean;
}

const declaredLevelClassName: Record<string, string> = {
  beginner: 'bg-slate-100 text-slate-700',
  intermediate: 'bg-blue-100 text-blue-700',
  expert: 'bg-amber-100 text-amber-800',
};

const badgeClassName: Record<string, string> = {
  Trusted: 'bg-emerald-100 text-emerald-700',
  Established: 'bg-sky-100 text-sky-700',
  Building: 'bg-violet-100 text-violet-700',
  New: 'bg-slate-100 text-slate-700',
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const CredibilityPills: React.FC<CredibilityPillsProps> = ({
  declaredLevel,
  badge,
  credibilityScore,
  compact = false,
}) => {
  const textSize = compact ? 'text-[11px]' : 'text-xs';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-3 py-1 font-semibold ${textSize} ${
          declaredLevelClassName[declaredLevel] ?? declaredLevelClassName.beginner
        }`}
      >
        {capitalize(declaredLevel)}
      </span>
      <span
        className={`rounded-full px-3 py-1 font-semibold ${textSize} ${
          badgeClassName[badge] ?? badgeClassName.New
        }`}
      >
        {badge}
      </span>
      {typeof credibilityScore === 'number' && (
        <span className={`rounded-full bg-slate-900 px-3 py-1 font-semibold text-white ${textSize}`}>
          {credibilityScore}/100
        </span>
      )}
    </div>
  );
};

export default CredibilityPills;
