import { describe, expect, it } from "vitest";
import {
  ADMIN_LOGIN_EMAIL_MAX_LENGTH,
  ADMIN_LOGIN_PASSWORD_MAX_LENGTH,
  parseAdminLoginForm,
  parseAdminLoginInput,
} from "./admin-login-input";

describe("admin login input bounds", () => {
  it("accepts exactly one string email and password", () => {
    const data = new FormData();
    data.append("email", "  ADMIN@EXAMPLE.COM  ");
    data.append("password", "synthetic-password");
    const result = parseAdminLoginForm(data);
    expect(result.valid).toBe(true);
    expect(result.email).toBe("admin@example.com");
    expect(result.password).toBe("synthetic-password");
  });

  it.each(["email", "password"])("rejects repeated %s values without losing admission identity", key => {
    const data = new FormData();
    data.set("email", "admin@example.com");
    data.set("password", "correct-password");
    data.append(key, "alternate-credential");
    const result = parseAdminLoginForm(data);
    expect(result.valid).toBe(false);
    expect(result.rateLimitSubject).toBe("admin@example.com");
  });

  it.each(["email", "password"])("rejects file-valued %s credentials", key => {
    const data = new FormData();
    data.set("email", "admin@example.com");
    data.set("password", "correct-password");
    data.set(key, new File(["not-credentials"], "credential.txt"));
    expect(parseAdminLoginForm(data).valid).toBe(false);
  });


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
