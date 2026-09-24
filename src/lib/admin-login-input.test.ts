import { describe, expect, it } from "vitest";
import {
  ADMIN_LOGIN_EMAIL_MAX_LENGTH,
  ADMIN_LOGIN_PASSWORD_MAX_LENGTH,
  parseAdminLoginInput,
} from "./admin-login-input";

describe("admin login input bounds", () => {
  it("normalizes a normal staff login", () => {
    expect(parseAdminLoginInput("  ADMIN@EXAMPLE.COM ", "correct horse battery staple")).toEqual({
      email: "admin@example.com",
      password: "correct horse battery staple",
      valid: true,
      rateLimitSubject: "admin@example.com",
    });
  });

  it("rejects malformed or empty credentials", () => {
    expect(parseAdminLoginInput("not-an-email", "password").valid).toBe(false);
    expect(parseAdminLoginInput("", "password").valid).toBe(false);
    expect(parseAdminLoginInput("admin@example.com", "").valid).toBe(false);
  });

  it("rejects oversized email/password values before expensive password verification", () => {
    const longEmail = `${"a".repeat(ADMIN_LOGIN_EMAIL_MAX_LENGTH)}@example.com`;
    const longPassword = "x".repeat(ADMIN_LOGIN_PASSWORD_MAX_LENGTH + 1);

    const emailResult = parseAdminLoginInput(longEmail, "password");
    const passwordResult = parseAdminLoginInput("admin@example.com", longPassword);

    expect(emailResult.valid).toBe(false);
    expect(emailResult.rateLimitSubject.length).toBeLessThanOrEqual(ADMIN_LOGIN_EMAIL_MAX_LENGTH);
    expect(passwordResult.valid).toBe(false);
  });
});
