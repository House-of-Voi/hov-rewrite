'use client';

import Modal from './Modal';
import Button from './Button';
import CopyButton from './CopyButton';
import { TicketIcon } from './icons';
import { formatCurrency } from '@/lib/referrals/credits';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referrals: any[];
  referralDetails: Record<string, any>;
}

export default function ReferralModal({
  isOpen,
  onClose,
  referrals,
  referralDetails,
}: ReferralModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Referral Codes" size="xl">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gold-900/20 to-royal-900/20 border border-gold-500/20">
          <p className="text-sm text-neutral-400">
            Each code is for one specific person. Earn <span className="text-gold-400 font-bold">0.5% of their wagers</span> as free game credits!
          </p>
        </div>

        {/* Create Code Button */}
        <div className="flex justify-end">
          <Button variant="primary" size="sm">
            <div className="flex items-center gap-2">
              <TicketIcon size={16} />
              <span>Create New Code</span>
            </div>
          </Button>
        </div>

        {/* Referral Codes List */}
        <div className="space-y-4">
          {referrals.map((referral) => {
            const details = referralDetails[referral.referral_code];
            const isConverted = !!referral.referred_profile_id;
            const isPending = referral.attributed_at && !referral.converted_at;
            const isUnused = !referral.attributed_at;

            return (
              <div
                key={referral.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isConverted
                    ? 'border-green-500/30 bg-green-500/5'
                    : isPending
                    ? 'border-gold-500/30 bg-gold-500/5'
                    : 'border-neutral-800 hover:bg-neutral-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-gold-400 mt-1">
                      <TicketIcon size={24} />
                    </div>
                    <div className="flex-1">
                      {/* Code Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-lg font-black text-gold-400">
                          {referral.referral_code}
                        </span>
                        {isConverted && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 uppercase font-bold">
                            Active
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full border border-gold-500/30 uppercase font-bold">
                            Pending
                          </span>
                        )}
                        {isUnused && (
                          <span className="px-2 py-0.5 bg-neutral-700/50 text-neutral-400 text-xs rounded-full border border-neutral-600 uppercase font-bold">
                            Unused
                          </span>
                        )}
                        {referral.deactivated_at && (
                          <span className="px-2 py-0.5 bg-ruby-500/20 text-ruby-400 text-xs rounded-full border border-ruby-500/30 uppercase font-bold">
                            Deactivated
                          </span>
                        )}
                      </div>

                      {/* Referral Details */}
                      {isConverted && details ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-royal-500/20 flex items-center justify-center text-royal-400 font-bold text-sm">
                              {details.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-neutral-300">{details.username}</div>
                              <div className="text-xs text-neutral-500">
                                Joined {new Date(details.joined_at).toLocaleDateString()} •{' '}
                                {details.gamesPlayed} games played
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-2 rounded bg-neutral-900/50 border border-neutral-800">
                              <div className="text-xs text-neutral-500 mb-1">Credits Earned</div>
                              <div className="text-sm font-bold text-gold-400">
                                ${formatCurrency(details.creditsEarned)}
                              </div>
                            </div>
                            <div className="p-2 rounded bg-neutral-900/50 border border-neutral-800">
                              <div className="text-xs text-neutral-500 mb-1">Total Wagered</div>
                              <div className="text-sm font-bold text-royal-400">
                                ${formatCurrency(details.totalWagered)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="text-sm text-neutral-400">
                          Link clicked {new Date(referral.attributed_at!).toLocaleDateString()} •
                          Awaiting signup
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-400">
                          Created {new Date(referral.created_at).toLocaleDateString()} • Not yet
                          shared
                        </div>
                      )}

                      {/* Link */}
                      {!referral.deactivated_at && (
                        <div className="mt-3 text-xs font-mono text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          {`https://houseofvoi.com/r/${referral.referral_code}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!referral.deactivated_at && (
                      <>
                        <CopyButton
                          text={`https://houseofvoi.com/r/${referral.referral_code}`}
                          label="Copy"
                        />
                        <button className="px-3 py-1.5 text-xs text-ruby-400 border border-ruby-500/30 rounded hover:bg-ruby-500/10 transition-colors">
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Tip */}
        <div className="pt-4 border-t border-neutral-800">
          <p className="text-sm text-neutral-500">
            <strong className="text-neutral-400">Tip:</strong> Create unique codes for each person
            you want to invite. Once they sign up and play, you'll earn 0.5% of their wagers as
            free credits!
          </p>
        </div>
      </div>
    </Modal>
  );
}
