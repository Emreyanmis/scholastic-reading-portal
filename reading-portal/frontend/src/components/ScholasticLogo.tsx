/** Official Scholastic wordmark (see public/scholastic-logo.svg). */
export function ScholasticLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <img
      src="/scholastic-logo.svg"
      alt="Scholastic"
      className={className}
      width={913}
      height={110}
      decoding="async"
    />
  );
}
