import Link from "next/link";
export default function NotFound() { return <section className="section"><div className="container"><p className="eyebrow">404</p><h1>Page not found</h1><p className="lead">The page may have moved or the appeal is no longer available.</p><div className="actions"><Link className="button" href="/">Return home</Link></div></div></section>; }
