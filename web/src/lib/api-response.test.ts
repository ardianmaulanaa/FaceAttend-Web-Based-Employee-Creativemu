import { describe, expect, it } from "vitest";
import { jsonApiError, jsonMessageError, jsonOk } from "@/lib/api-response";

describe("api response helpers", () => {
  it("returns successful JSON responses with a custom status", async () => {
    const response = jsonOk({ success: true, id: "attendance-1" }, 201);

    await expect(response.json()).resolves.toEqual({
      success: true,
      id: "attendance-1",
    });
    expect(response.status).toBe(201);
  });

  it("returns message errors with the expected envelope", async () => {
    const response = jsonMessageError("Foto wajib diunggah.", 422);

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Foto wajib diunggah.",
    });
    expect(response.status).toBe(422);
  });

  it("maps auth errors without leaking raw exception details", async () => {
    const response = jsonApiError(
      new Error("Token login tidak ditemukan."),
      "Gagal menyimpan absensi.",
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Silakan login terlebih dahulu.",
    });
    expect(response.status).toBe(401);
  });
});
