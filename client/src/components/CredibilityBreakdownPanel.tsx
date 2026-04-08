import React from 'react';
import { ApiCredibilityBreakdown } from '../types';

interface CredibilityBreakdownPanelProps {
  breakdown: ApiCredibilityBreakdown;
  compact?: boolean;
}

const breakdownRows: Array<{
  key: keyof ApiCredibilityBreakdown;
  label: string;
  format?: (value: number) => string;
}> = [
  { key: 'completionRate', label: 'Completion rate', format: (value) => `${Math.round(value * 100)}%` },
  { key: 'avgRating', label: 'Average rating', format: (value) => value.toFixed(2) },
  { key: 'repeatClientsRatio', label: 'Repeat client ratio', format: (value) => `${Math.round(value * 100)}%` },
  { key: 'disputePenalty', label: 'Dispute penalty', format: (value) => `${Math.round(value * 100)}%` },
  { key: 'proofBonus', label: 'Proof bonus', format: (value) => `+${value.toFixed(2)}` },
  { key: 'finalScore', label: 'Final score', format: (value) => `${Math.round(value * 100)}/100` },
];

const CredibilityBreakdownPanel: React.FC<CredibilityBreakdownPanelProps> = ({
  breakdown,
  compact = false,
}) => {
  const gridClassName = compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Transparency
        </p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">Credibility breakdown</h3>
        <p className="mt-1 text-sm text-slate-500">
          Every score component is visible so providers and requesters can understand how trust is earned.
        </p>
      </div>

      <div className={`grid gap-3 ${gridClassName}`}>
        {breakdownRows.map((row) => {
          const rawValue = breakdown[row.key];
          const displayValue =
            typeof rawValue === 'number'
              ? row.format
                ? row.format(rawValue)
                : rawValue.toFixed(2)
              : String(rawValue);

          return (
            <div
              key={row.key}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{displayValue}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          Weighted reviews: <span className="font-semibold text-slate-900">{breakdown.weightedReviewCount.toFixed(2)}</span>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          Flagged reviews: <span className="font-semibold text-slate-900">{breakdown.flaggedReviewCount}</span>
        </div>
        <div className="rounded-xl bg-sky-50 px-4 py-3">
          Verified proofs: <span className="font-semibold text-slate-900">{breakdown.verifiedProofs}</span>
        </div>
      </div>
    </div>
  );
};

export default CredibilityBreakdownPanel;
