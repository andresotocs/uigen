import { test, expect, vi, beforeEach, describe } from "vitest";
import { createSession, getSession } from "@/lib/auth";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock next/headers
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock jose
const mockSign = vi.fn();
const mockSetProtectedHeader = vi.fn(() => ({
  setExpirationTime: vi.fn(() => ({
    setIssuedAt: vi.fn(() => ({
      sign: mockSign,
    })),
  })),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: mockSetProtectedHeader,
  })),
  jwtVerify: vi.fn(),
}));

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSign.mockResolvedValue("mock-jwt-token");
  });

  test("creates session with correct userId and email", async () => {
    const userId = "user123";
    const email = "test@example.com";

    await createSession(userId, email);

    const { SignJWT } = await import("jose");
    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        email: "test@example.com",
        expiresAt: expect.any(Date),
      })
    );
  });

  test("sets expiration to 7 days from now", async () => {
    const beforeCall = Date.now();
    await createSession("user123", "test@example.com");
    const afterCall = Date.now();

    const { SignJWT } = await import("jose");
    const callArgs = (SignJWT as any).mock.calls[0][0];
    const expiresAt = callArgs.expiresAt.getTime();

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expectedMin = beforeCall + sevenDaysInMs;
    const expectedMax = afterCall + sevenDaysInMs;

    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  test("creates JWT with HS256 algorithm", async () => {
    await createSession("user123", "test@example.com");

    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  });

  test("sets JWT expiration time to 7 days", async () => {
    await createSession("user123", "test@example.com");

    const setExpirationTime =
      mockSetProtectedHeader.mock.results[0].value.setExpirationTime;
    expect(setExpirationTime).toHaveBeenCalledWith("7d");
  });

  test("sets cookie with correct name and token", async () => {
    mockSign.mockResolvedValue("test-jwt-token-123");

    await createSession("user123", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "test-jwt-token-123",
      expect.any(Object)
    );
  });

  test("sets cookie with httpOnly flag", async () => {
    await createSession("user123", "test@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.httpOnly).toBe(true);
  });

  test("sets cookie with sameSite lax", async () => {
    await createSession("user123", "test@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.sameSite).toBe("lax");
  });

  test("sets cookie with path /", async () => {
    await createSession("user123", "test@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.path).toBe("/");
  });

  test("sets cookie with correct expiration date", async () => {
    const beforeCall = Date.now();
    await createSession("user123", "test@example.com");
    const afterCall = Date.now();

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    const expiresAt = cookieOptions.expires.getTime();

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expectedMin = beforeCall + sevenDaysInMs;
    const expectedMax = afterCall + sevenDaysInMs;

    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  test("sets secure flag to false in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    await createSession("user123", "test@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.secure).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });

  test("sets secure flag to true in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await createSession("user123", "test@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.secure).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  test("handles special characters in email", async () => {
    const email = "test+alias@example.co.uk";

    await createSession("user123", email);

    const { SignJWT } = await import("jose");
    const callArgs = (SignJWT as any).mock.calls[0][0];
    expect(callArgs.email).toBe(email);
  });

  test("handles empty userId", async () => {
    await createSession("", "test@example.com");

    const { SignJWT } = await import("jose");
    const callArgs = (SignJWT as any).mock.calls[0][0];
    expect(callArgs.userId).toBe("");
  });

  test("calls cookies() function to get cookie store", async () => {
    const { cookies } = await import("next/headers");

    await createSession("user123", "test@example.com");

    expect(cookies).toHaveBeenCalled();
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });

  test("returns null when cookie value is empty", async () => {
    mockCookieStore.get.mockReturnValue({ value: "" });

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns session payload when token is valid", async () => {
    const mockPayload = {
      userId: "user123",
      email: "test@example.com",
      expiresAt: new Date("2026-01-11T00:00:00.000Z"),
    };

    mockCookieStore.get.mockReturnValue({ value: "valid-jwt-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session).toEqual(mockPayload);
    expect(jwtVerify).toHaveBeenCalledWith("valid-jwt-token", expect.anything());
  });

  test("returns null when token verification fails", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid-jwt-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns null when token is expired", async () => {
    mockCookieStore.get.mockReturnValue({ value: "expired-jwt-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockRejectedValue(new Error("Token expired"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns null when token signature is invalid", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tampered-jwt-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockRejectedValue(new Error("Invalid signature"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("returns correct session data structure", async () => {
    const mockPayload = {
      userId: "abc-123",
      email: "user@test.com",
      expiresAt: new Date("2026-02-01T00:00:00.000Z"),
    };

    mockCookieStore.get.mockReturnValue({ value: "valid-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session).toHaveProperty("userId", "abc-123");
    expect(session).toHaveProperty("email", "user@test.com");
    expect(session).toHaveProperty("expiresAt");
  });

  test("calls cookies() function to get cookie store", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const { cookies } = await import("next/headers");

    await getSession();

    expect(cookies).toHaveBeenCalled();
  });

  test("handles malformed JWT gracefully", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt.format" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockRejectedValue(new Error("Malformed JWT"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  test("handles missing payload fields gracefully", async () => {
    const incompletePayload = {
      userId: "user123",
    };

    mockCookieStore.get.mockReturnValue({ value: "valid-token" });

    const { jwtVerify } = await import("jose");
    (jwtVerify as any).mockResolvedValue({ payload: incompletePayload });

    const session = await getSession();

    expect(session).toEqual(incompletePayload);
  });
});
