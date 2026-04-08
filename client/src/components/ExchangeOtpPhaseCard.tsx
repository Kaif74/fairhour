import React from 'react';
import { CheckCircle2, Clock3, Copy, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import Button from './Button';
import { ApiOtpPhaseStatus } from '../types';

interface ExchangeOtpPhaseCardProps {
  title: string;
  description: string;
  phaseStatus: ApiOtpPhaseStatus;
  revealedOtp: string | null;
  sharePrompt: string;
  verifyPrompt: string;
  verifyValue: string;
  onVerifyValueChange: (value: string) => void;
  onGenerate: () => void;
  onVerify: () => void;
  onCopyOtp: () => void;
  generateLabel: string;
  verifyLabel: string;
  isGenerating: boolean;
  isVerifying: boolean;
  lockedMessage?: string;
  waitingMessage?: string;
}

const badgeClassMap: Record<ApiOtpPhaseStatus['status'], string> = {
  not_started: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-700',
  expired: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
};

const badgeLabelMap: Record<ApiOtpPhaseStatus['status'], string> = {
  not_started: 'Not started',
  pending: 'Waiting',
  expired: 'Expired',
  verified: 'Verified',
};

const roleLabel = (role: 'provider' | 'requester') =>
  role === 'provider' ? 'Provider' : 'Receiver';

const ExchangeOtpPhaseCard: React.FC<ExchangeOtpPhaseCardProps> = ({
  title,
  description,
  phaseStatus,
  revealedOtp,
  sharePrompt,
  verifyPrompt,
  verifyValue,
  onVerifyValueChange,
  onGenerate,
  onVerify,
  onCopyOtp,
  generateLabel,
  verifyLabel,
  isGenerating,
  isVerifying,
  lockedMessage,
  waitingMessage,
}) => {
  const showGenerateButton =
    phaseStatus.currentUserRoleInPhase === 'generator' &&
    (phaseStatus.canGenerate || phaseStatus.status === 'not_started' || phaseStatus.status === 'expired');

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h4 className="text-base font-semibold text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassMap[phaseStatus.status]}`}
        >
          {badgeLabelMap[phaseStatus.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">OTP shared by</span>
          <span className="font-medium text-gray-900">{roleLabel(phaseStatus.generatedFor)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">OTP entered by</span>
          <span className="font-medium text-gray-900">{roleLabel(phaseStatus.verifiedBy)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Verification</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              phaseStatus.verified ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {phaseStatus.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
        {phaseStatus.expiresAt && phaseStatus.status !== 'verified' && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock3 className="mr-1.5 h-3.5 w-3.5" />
            Expires{' '}
            {new Date(phaseStatus.expiresAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {lockedMessage ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          {lockedMessage}
        </div>
      ) : (
        <>
          {waitingMessage && (
            <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {waitingMessage}
            </div>
          )}

          {revealedOtp && (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {sharePrompt}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-brand-700 shadow-sm">
                  {revealedOtp}
                </div>
                <Button variant="outline" size="sm" onClick={onCopyOtp} fullWidth className="md:w-auto">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {!revealedOtp &&
            phaseStatus.currentUserRoleInPhase === 'generator' &&
            phaseStatus.status === 'pending' && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This OTP is already active and was only shown once. If you no longer have it, wait
                for it to expire and generate a fresh one.
              </div>
            )}

          {phaseStatus.canVerify && phaseStatus.status !== 'verified' && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {verifyPrompt}
              </label>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
                <input
                  type="text"
                  value={verifyValue}
                  onChange={(event) => onVerifyValueChange(event.target.value)}
                  maxLength={6}
                  placeholder="6-digit OTP"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium tracking-[0.2em] text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Button
                  onClick={onVerify}
                  disabled={isVerifying || verifyValue.trim().length !== 6}
                  fullWidth
                  className="min-h-[52px] whitespace-nowrap md:w-auto"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {verifyLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {showGenerateButton && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {phaseStatus.generationAttemptsRemaining} generation
                {phaseStatus.generationAttemptsRemaining === 1 ? '' : 's'} left,{' '}
                {phaseStatus.verifyAttemptsRemaining} verify
                {phaseStatus.verifyAttemptsRemaining === 1 ? '' : ' attempts'} left.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={onGenerate}
                fullWidth
                className="sm:w-auto"
                disabled={
                  !phaseStatus.canGenerate ||
                  phaseStatus.generationAttemptsRemaining <= 0 ||
                  isGenerating
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {generateLabel}
                  </>
                )}
              </Button>
            </div>
          )}

          {phaseStatus.status === 'verified' && (
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                This OTP phase has been verified successfully.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExchangeOtpPhaseCard;
