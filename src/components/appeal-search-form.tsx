import Link from "next/link";
import styles from "./appeal-search-form.module.css";

type AppealSearchFormProps = {
  /** The accepted query, echoed into the field. Empty when the query was rejected. */
  query: string;
  /** The submitted query could not be read (control characters, too long). */
  invalid: boolean;
  /** A valid search is currently applied. */
  active: boolean;
};

/** GET-only search over reviewed public appeal titles. The query is never stored. */
export function AppealSearchForm({ query, invalid, active }: AppealSearchFormProps) {
  return (
    <>
      <form key={query} className={`form-grid ${styles.form}`} method="get" action="/appeals#current-appeals" role="search" aria-label="Search active appeals">
        <label className="field" htmlFor="appeal-search">Search active appeals<input id="appeal-search" name="q" type="search" enterKeyHint="search" maxLength={80} defaultValue={query} aria-invalid={invalid || undefined} aria-describedby={invalid ? "appeal-search-help appeal-search-error" : "appeal-search-help"} /></label>
        <button className="v2-button" type="submit">Find appeals</button>
        {active && <Link className="v2-text-link" href="/appeals#current-appeals">Clear appeal search</Link>}
      </form>
      <p id="appeal-search-help">Search reviewed public titles and summaries. Do not enter personal or case details.</p>
      {invalid && <p id="appeal-search-error" role="status">This search could not be read. Clear the search or use up to 80 characters.</p>}
    </>
  );
}
