export function getApiErrorStatus(error: unknown) {
  if (!(error instanceof Error)) return 500;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes("akses")) return 403;

  if (
    message.includes("token login") ||
    message.includes("user id tidak ditemukan di token") ||
    name.includes("jwt") ||
    name.includes("jws") ||
    name.includes("jose")
  ) {
    return 401;
  }

  return 500;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan server.",
) {
  const status = getApiErrorStatus(error);

  if (status === 401) return "Silakan login terlebih dahulu.";
  if (status === 403) return "Akses ditolak.";

  return fallback;
}
