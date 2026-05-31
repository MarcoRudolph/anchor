/**
 * Flower-of-Life brand icon (DESIGN.md spec).
 * 7-circle sacred geometry, stroke-only, no fill.
 * Always uses currentColor — inherits from parent container.
 */
export function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="3 2 34 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="9" strokeOpacity="0.9" />
      <circle cx="20" cy="11" r="9" strokeOpacity="0.65" />
      <circle cx="27.8" cy="15.5" r="9" strokeOpacity="0.65" />
      <circle cx="27.8" cy="24.5" r="9" strokeOpacity="0.65" />
      <circle cx="20" cy="29" r="9" strokeOpacity="0.65" />
      <circle cx="12.2" cy="24.5" r="9" strokeOpacity="0.65" />
      <circle cx="12.2" cy="15.5" r="9" strokeOpacity="0.65" />
    </svg>
  );
}
