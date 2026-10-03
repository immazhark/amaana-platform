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
