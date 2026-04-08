import React, { useState } from 'react';
import { BadgeCheck, ExternalLink, ImageIcon, ShieldAlert, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ApiCredibilityProof } from '../types';

interface CredibilityProofListProps {
  proofs: ApiCredibilityProof[];
  canVote?: boolean;
  isOwner?: boolean;
  onVote?: (proofId: string, voteType: 'valid' | 'irrelevant' | 'fake') => Promise<void>;
}

const voteStyles: Record<'valid' | 'irrelevant' | 'fake', string> = {
  valid: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  irrelevant: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  fake: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
};

const proofTypeLabel: Record<ApiCredibilityProof['proofType'], string> = {
  certificate: 'Certificate',
  portfolio: 'Portfolio',
  link: 'Link',
  image: 'Image',
};

const CredibilityProofList: React.FC<CredibilityProofListProps> = ({
  proofs,
  canVote = false,
  isOwner = false,
  onVote,
}) => {
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);

  const handleVote = async (proofId: string, voteType: 'valid' | 'irrelevant' | 'fake') => {
    if (!onVote) return;

    try {
      setPendingVoteId(proofId);
      await onVote(proofId, voteType);
    } finally {
      setPendingVoteId(null);
    }
  };

  if (proofs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
        No proofs uploaded for this skill yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proofs.map((proof) => (
        <div
          key={proof.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {proofTypeLabel[proof.proofType]}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    proof.isVerified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {proof.isVerified ? 'Verified' : 'Pending verification'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {proof.description || 'No description provided.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <a
                  href={proof.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                >
                  Open proof <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span>Proof score {proof.votes.proofScore.toFixed(2)}</span>
                <span>{new Date(proof.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {proof.proofType === 'image' ? (
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <img
                  src={proof.proofUrl}
                  alt={proof.description || 'Proof'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                {proof.proofType === 'link' || proof.proofType === 'portfolio' ? (
                  <ExternalLink className="h-8 w-8" />
                ) : (
                  <ImageIcon className="h-8 w-8" />
                )}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Valid votes <span className="font-semibold">{proof.votes.validVotes}</span>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Irrelevant votes <span className="font-semibold">{proof.votes.irrelevantVotes}</span>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Fake votes <span className="font-semibold">{proof.votes.fakeVotes}</span>
            </div>
          </div>

          {canVote && !isOwner && onVote && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Help validate this proof
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleVote(proof.id, 'valid')}
                  disabled={pendingVoteId === proof.id}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${voteStyles.valid}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Valid
                </button>
                <button
                  onClick={() => handleVote(proof.id, 'irrelevant')}
                  disabled={pendingVoteId === proof.id}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${voteStyles.irrelevant}`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Irrelevant
                </button>
                <button
                  onClick={() => handleVote(proof.id, 'fake')}
                  disabled={pendingVoteId === proof.id}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${voteStyles.fake}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Fake
                </button>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <BadgeCheck className="h-3.5 w-3.5" />
              Community voting determines verification status
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CredibilityProofList;
