import { describe, expect, it } from "vitest";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

describe("api error mapping", () => {
  it("maps missing login token errors to unauthorized responses", () => {
    const error = new Error("Token login tidak ditemukan.");

    expect(getApiErrorStatus(error)).toBe(401);
    expect(getApiErrorMessage(error)).toBe("Silakan login terlebih dahulu.");
  });

  it("maps access errors to forbidden responses", () => {
    const error = new Error("Akses ditolak.");

    expect(getApiErrorStatus(error)).toBe(403);
    expect(getApiErrorMessage(error)).toBe("Akses ditolak.");
  });

  it("hides unexpected error details behind the fallback message", () => {
    const error = new Error("database connection failed");

    expect(getApiErrorStatus(error)).toBe(500);
    expect(getApiErrorMessage(error, "Gagal memproses request.")).toBe(
      "Gagal memproses request.",
    );
  });
});
