import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "@/lib/auth";

const originalJwtSecret = process.env.JWT_SECRET;

describe("auth helpers", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-minimum-32-characters";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("hashes passwords and rejects the wrong password", async () => {
    const hash = await hashPassword("correct-password");

    expect(hash).not.toBe("correct-password");
    await expect(verifyPassword("correct-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates and verifies a JWT payload", async () => {
    const token = await createToken({
      id: "user-1",
      email: "owner@creativemu.com",
      role: "owner",
    });

    await expect(verifyToken(token)).resolves.toMatchObject({
      id: "user-1",
      email: "owner@creativemu.com",
      role: "owner",
    });
  });

  it("fails fast when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(
      createToken({
        id: "user-1",
        email: "owner@creativemu.com",
        role: "owner",
      }),
    ).rejects.toThrow("JWT_SECRET belum diatur");
  });
});
