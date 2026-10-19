export const ADMIN_LOGIN_EMAIL_MAX_LENGTH = 254;
export const ADMIN_LOGIN_PASSWORD_MAX_LENGTH = 256;

const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAdminLoginInput(emailValue: FormDataEntryValue | null, passwordValue: FormDataEntryValue | null) {
  const email = String(emailValue ?? "").trim().toLowerCase();
  const password = String(passwordValue ?? "");

  const emailValid =
    email.length > 0
    && email.length <= ADMIN_LOGIN_EMAIL_MAX_LENGTH
    && basicEmailPattern.test(email);

  const passwordValid =
    password.length > 0
    && password.length <= ADMIN_LOGIN_PASSWORD_MAX_LENGTH;

  return {
    email,
    password,
    valid: emailValid && passwordValid,
    rateLimitSubject: email.slice(0, ADMIN_LOGIN_EMAIL_MAX_LENGTH),
  };
}

/** Invalid or ambiguous credentials still count toward login admission. */
export function parseAdminLoginForm(form: FormData) {
  const emails = form.getAll("email");
  const passwords = form.getAll("password");
  const email = emails.length === 1 && typeof emails[0] === "string" ? emails[0] : null;
  const password = passwords.length === 1 && typeof passwords[0] === "string" ? passwords[0] : null;
  const input = parseAdminLoginInput(email, password);

  // Keep the first valid email as the rate-limit subject when a request
  // repeats the email field. Never use a duplicated value to authenticate.
  if (emails.length > 1 && typeof emails[0] === "string") {
    const first = parseAdminLoginInput(emails[0], password);
    return { ...input, valid: false, rateLimitSubject: first.rateLimitSubject };
  }

  return input;
}
