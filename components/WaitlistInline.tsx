import Card, { CardContent } from '@/components/Card';
import { UsersIcon, TicketIcon } from '@/components/icons';
import Button from '@/components/Button';

interface WaitlistInlineProps {
  waitlistPosition: number | null;
  joinedAt: string | null;
  hasReferral: boolean;
  totalOnWaitlist: number;
  showFullLink?: boolean;
}

/**
 * Inline waitlist status component
 * Shows user's waitlist position and info without taking full page
 */
export default function WaitlistInline({
  waitlistPosition,
  joinedAt,
  hasReferral,
  totalOnWaitlist,
  showFullLink = true,
}: WaitlistInlineProps) {
  const joinDate = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-2">
          <TicketIcon size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-950 dark:text-white">
          You&apos;re on the Waitlist
        </h1>
        <p className="text-neutral-700 dark:text-neutral-300 text-lg max-w-2xl mx-auto">
          We&apos;re gradually rolling out game access. You&apos;ll be notified when it&apos;s your turn to play!
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Position Card */}
        <Card elevated>
          <CardContent className="p-6 text-center space-y-3">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              Your Position
            </div>
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {waitlistPosition !== null ? `#${waitlistPosition}` : 'Pending'}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              out of {totalOnWaitlist.toLocaleString()} total
            </div>
          </CardContent>
        </Card>

        {/* Join Date Card */}
        <Card elevated>
          <CardContent className="p-6 text-center space-y-3">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              Joined Waitlist
            </div>
            <div className="text-lg font-semibold text-neutral-950 dark:text-white">
              {joinDate || 'Recently'}
            </div>
            {hasReferral && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300 rounded-full text-xs font-medium">
                <UsersIcon size={12} />
                Referred
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
            What happens next?
          </h3>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-xs mt-0.5">
                1
              </div>
              <span>We&apos;ll notify you via email when your access is granted</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-xs mt-0.5">
                2
              </div>
              <span>Once granted, you&apos;ll be able to access all games and features</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-xs mt-0.5">
                3
              </div>
              <span>Your referral code and rewards will be waiting for you</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {showFullLink && (
        <div className="text-center space-y-4">
          <a href="/app/waitlist" className="inline-block">
            <Button variant="outline" size="md">
              Enter Referral Code
            </Button>
          </a>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Have a referral code? Enter it to move up the waitlist.
          </div>
        </div>
      )}
    </div>
  );
}
