import Image from "next/image";

export default function Loading() {
  return (
    <div className="amaana-loading" role="status" aria-live="polite" aria-label="Loading Amaana Foundation">
      <div className="amaana-loading-inner">
        <div className="amaana-loading-mark-wrap" aria-hidden="true"><span className="amaana-loading-orbit"><i /><i /><i /></span>
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
        <div className="amaana-loading-pulse" aria-hidden="true"><i /><i /><i /></div>
        <p className="amaana-loading-copy">Preparing the next page</p>
      </div>
    </div>
  );
}
