import Link from "next/link";
export default function ForbiddenPage() { return <section className="section"><div className="container"><p className="eyebrow">Access restricted</p><h1>You do not have permission.</h1><p className="lead">Your account is signed in, but this action is not assigned to your role.</p><Link className="button" href="/admin">Return to admin</Link></div></section>; }
