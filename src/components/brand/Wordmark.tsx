/**
 * Anchor brand wordmark (DESIGN.md spec).
 * Spinning Flower-of-Life icon + Unbounded weight-900 lowercase wordmark.
 * The wordmark literal is in this component — NEVER in a locale file (DEC-0012/FR-080).
 */
import { FlowerIcon } from './FlowerIcon';

interface WordmarkProps {
  /** Product wordmark. Defaults to 'anchor'. Lowercase always. */
  wordmark?: string;
  className?: string;
}

export function Wordmark({ wordmark = 'anchor', className }: WordmarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`.trim()}>
      {/* Flower-of-Life: orange, size-7 (28px), perpetual 10s spin */}
      <div className="spin-slow text-primary-500 size-7 shrink-0" aria-hidden="true">
        <FlowerIcon className="size-7" />
      </div>
      {/* Unbounded weight 900, tracking-tight, lowercase — rendered as text, not locale string */}
      <span className="font-display text-xl font-black tracking-tight text-neutral-900 lowercase">
        {wordmark}
      </span>
    </div>
  );
}
