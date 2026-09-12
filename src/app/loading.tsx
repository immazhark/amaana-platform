import Image from "next/image";

export default function Loading() {
  return (
    <div className="amaana-loading" role="status" aria-live="polite" aria-label="Loading Amaana Foundation">
      <div className="amaana-loading-inner">
        <div className="amaana-loading-mark-wrap" aria-hidden="true">
          <Image
            className="amaana-loading-mark"
            src="/brand/amaana-mark.svg"
            alt=""
            width={96}
            height={96}
            priority
          />
        </div>
        <div className="amaana-loading-wordmark" aria-hidden="true">
          <strong>AMAANA</strong>
          <span>FOUNDATION</span>
        </div>
        <div className="amaana-loading-track" aria-hidden="true" />
        <p className="amaana-loading-copy">Carrying care with dignity.</p>
      </div>
    </div>
  );
}
