import React from 'react';
import { BadgeCheck, Briefcase, CheckCircle2, Shield, Star } from 'lucide-react';
import { ApiOccupationCredibilitySummary, ApiUserOccupationCredibility } from '../types';
import CredibilityPills from './CredibilityPills';

type CredibilityData = ApiOccupationCredibilitySummary | ApiUserOccupationCredibility;

interface CredibilityCardProps {
  credibility: CredibilityData;
  compact?: boolean;
}

const CredibilityCard: React.FC<CredibilityCardProps> = ({ credibility, compact = false }) => {
  const title = credibility.occupationTitle || 'Skill credibility';
  const verifiedProofs = credibility.verifiedProofs;
  const statsGridClassName = compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4';
  const statValueClassName = compact ? 'text-xl' : 'text-2xl';
  const statCardClassName = compact ? 'p-2.5' : 'p-3';
  const statLabelClassName = compact ? 'text-[11px]' : 'text-xs';
  const subtitleClassName = compact ? 'text-[11px] leading-snug' : 'text-xs';
  const headerClassName = compact
    ? 'space-y-3'
    : 'flex flex-wrap items-start justify-between gap-3';
  const titleClassName = compact ? 'text-[1.15rem] leading-tight' : 'text-lg';

  return (
    <div className="min-w-0 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-sky-50/70 p-5 shadow-soft">
      <div className={headerClassName}>
        <div className={compact ? 'min-w-0' : 'min-w-0 flex-1'}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Credibility
          </p>
          <h3 className={`mt-2 min-w-0 font-bold text-slate-900 ${titleClassName}`}>
            <span className="block break-words [word-break:normal]">{title}</span>
          </h3>
        </div>

        <CredibilityPills
          declaredLevel={credibility.declaredLevel}
          badge={credibility.badge}
          credibilityScore={!compact ? credibility.credibilityScore : undefined}
          compact={compact}
        />
      </div>

      <div className={`mt-5 grid gap-3 ${statsGridClassName}`}>
        <div className={`min-w-0 rounded-xl bg-white/80 ring-1 ring-slate-100 ${statCardClassName}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className={`${statLabelClassName} font-medium`}>Score</span>
          </div>
          <p className={`mt-2 font-bold text-slate-900 ${statValueClassName}`}>
            {credibility.credibilityScore}
          </p>
          <p className={`text-slate-500 ${subtitleClassName}`}>out of 100</p>
        </div>

        <div className={`min-w-0 rounded-xl bg-white/80 ring-1 ring-slate-100 ${statCardClassName}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Briefcase className="h-4 w-4 text-sky-600" />
            <span className={`${statLabelClassName} font-medium`}>Jobs</span>
          </div>
          <p className={`mt-2 font-bold text-slate-900 ${statValueClassName}`}>
            {credibility.jobsCompleted}
          </p>
          <p className={`text-slate-500 ${subtitleClassName}`}>completed</p>
        </div>

        <div className={`min-w-0 rounded-xl bg-white/80 ring-1 ring-slate-100 ${statCardClassName}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            <span className={`${statLabelClassName} font-medium`}>Proofs</span>
          </div>
          <p className={`mt-2 font-bold text-slate-900 ${statValueClassName}`}>
            {verifiedProofs}
          </p>
          <p className={`text-slate-500 ${subtitleClassName}`}>verified</p>
        </div>

        <div className={`min-w-0 rounded-xl bg-white/80 ring-1 ring-slate-100 ${statCardClassName}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Star className="h-4 w-4 text-amber-500" />
            <span className={`${statLabelClassName} font-medium`}>Multiplier</span>
          </div>
          <p className={`mt-2 font-bold text-slate-900 ${statValueClassName}`}>
            x{credibility.experienceMultiplier.toFixed(2)}
          </p>
          <p className={`text-slate-500 ${subtitleClassName}`}>valuation boost</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-100">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Avg rating {credibility.avgRating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-100">
            Repeat clients {credibility.repeatClients}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-100">
            Disputes {credibility.disputeCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default CredibilityCard;
