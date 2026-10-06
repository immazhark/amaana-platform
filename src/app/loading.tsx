import Image from "next/image";

export default function Loading() {
  return (
    <div
      className="amaana-loading-route-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Amaana Foundation content"
    >
      <div className="amaana-loading-overlay" aria-hidden="true">
        <div className="amaana-loading-indicator">
          <Image
            className="amaana-loading-logo"
            src="/brand/amaana-mark.svg"
            width={754}
            height={752}
            sizes="96px"
            alt=""
            priority
          />
          <div className="amaana-loading-dots">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading Amaana Foundation content…</span>
    </div>
  );
}
