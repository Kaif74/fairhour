import React from 'react';
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
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">
                {labelMap[event.eventType] || event.eventType}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-500">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredibilityEventList;
