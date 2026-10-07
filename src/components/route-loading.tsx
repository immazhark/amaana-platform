import Image from "next/image";

export function RouteLoading({ label = "Loading page" }: { label?: string }) {
  return (
    <div
      className="amaana-loading-overlay amaana-navigation-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="amaana-loading-indicator">
        <Image
          className="amaana-loading-logo"
          src="/brand/amaana-mark.svg"
          alt=""
          aria-hidden="true"
          width={96}
          height={96}
          priority
        />
        <span className="amaana-loading-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
