import { getCurrentUser } from "@/lib/auth";
import { ADMIN_LOGIN_EMAIL_MAX_LENGTH, ADMIN_LOGIN_PASSWORD_MAX_LENGTH } from "@/lib/admin-login-input";
import { redirect } from "next/navigation";
import { login } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };
export default async function AdminLoginPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/admin");
  const { error } = await searchParams;
  return <section className="section"><div className="container"><form action={login} className="card admin-login"><p className="eyebrow">Staff access</p><h1>Admin sign in</h1>{error && <div className="form-error" role="alert">{error === "locked" ? "Too many unsuccessful attempts. Please wait 15 minutes and try again." : "The email or password is incorrect."}</div>}<div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" maxLength={ADMIN_LOGIN_EMAIL_MAX_LENGTH} required /></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={ADMIN_LOGIN_PASSWORD_MAX_LENGTH} required /></div><button className="button" type="submit">Sign in securely</button></form></div></section>;
}
