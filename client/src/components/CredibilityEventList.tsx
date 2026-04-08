import React from 'react';
import { AlertTriangle, BadgeCheck, FileCheck2, Star } from 'lucide-react';
import { ApiUserOccupationCredibility } from '../types';

interface CredibilityEventListProps {
  events: ApiUserOccupationCredibility['recentEvents'];
}

const labelMap: Record<string, string> = {
  job_completed: 'Job completed',
  review_added: 'Review added',
  dispute: 'Dispute signal',
  proof_added: 'Proof added',
};

const iconMap: Record<string, React.ElementType> = {
  job_completed: BadgeCheck,
  review_added: Star,
  dispute: AlertTriangle,
  proof_added: FileCheck2,
};

const shortId = (value: unknown) => {
  if (typeof value !== 'string' || value.length < 10) return value;
  return `${value.slice(0, 8)}...`;
};

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === 'string') {
    if (value.includes('T') && !Number.isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
};

const getEventDetails = (eventType: string, metadata: unknown) => {
  const data =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  switch (eventType) {
    case 'job_completed':
      return [
        data.hours ? { label: 'Hours', value: formatValue(data.hours) } : null,
        data.creditsEarned
          ? { label: 'Credits earned', value: formatValue(data.creditsEarned) }
          : null,
        data.verifiedDurationMinutes
          ? {
              label: 'Verified duration',
              value: `${formatValue(data.verifiedDurationMinutes)} min`,
            }
          : null,
        data.flaggedShortDuration === true
          ? { label: 'Short duration flag', value: 'Flagged for review' }
          : null,
        data.exchangeId ? { label: 'Exchange', value: shortId(data.exchangeId) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;

    case 'review_added':
      return [
        data.rating ? { label: 'Rating', value: `${formatValue(data.rating)} / 5` } : null,
        data.exchangeId ? { label: 'Exchange', value: shortId(data.exchangeId) } : null,
        data.reviewId ? { label: 'Review', value: shortId(data.reviewId) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;

    case 'proof_added':
      return [
        data.proofType ? { label: 'Proof type', value: formatValue(data.proofType) } : null,
        data.isVerified !== undefined
          ? { label: 'Verified', value: formatValue(data.isVerified) }
          : null,
        data.proofUrl ? { label: 'Source', value: formatValue(data.proofUrl) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;

    case 'dispute':
      return [
        data.reason ? { label: 'Reason', value: formatValue(data.reason) } : null,
        data.exchangeId ? { label: 'Exchange', value: shortId(data.exchangeId) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;

    default:
      return Object.entries(data)
        .slice(0, 5)
        .map(([key, value]) => ({
          label: key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^\w/, (char) => char.toUpperCase()),
          value: formatValue(value),
        }));
  }
};

const CredibilityEventList: React.FC<CredibilityEventListProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
        No credibility events yet for this skill.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          History
        </p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">Recent credibility events</h3>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          const Icon = iconMap[event.eventType] || BadgeCheck;
          const details = getEventDetails(event.eventType, event.metadata);

          return (
            <div
              key={event.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-white p-2 text-brand-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {labelMap[event.eventType] || event.eventType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {details.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {details.map((detail) => (
                    <div
                      key={`${event.id}-${detail.label}`}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {detail.label}
                      </p>
                      <p className="mt-1 text-slate-800 break-words">{detail.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CredibilityEventList;
