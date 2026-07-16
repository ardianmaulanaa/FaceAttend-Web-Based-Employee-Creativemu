import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");

// Helper to ensure data folder exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Audit Log helpers
export type AuditLog = {
  id: string;
  actorEmail: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: number;
};

export async function getAuditLogs(): Promise<AuditLog[]> {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "audit_logs.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Gagal membaca file audit logs:", err);
    return [];
  }
}

export async function addAuditLog(
  actorEmail: string,
  actorName: string,
  action: string,
  details: string
): Promise<void> {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "audit_logs.json");
  const logs = await getAuditLogs();
  
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actorEmail,
    actorName,
    action,
    details,
    timestamp: Date.now(),
  };

  logs.unshift(newLog); // Newest first
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menulis file audit logs:", err);
  }
}

// Read Receipt helpers
export type ReadReceipt = {
  announcementId: string;
  userEmail: string;
  userName: string;
  timestamp: number;
};

export async function getReadReceipts(): Promise<ReadReceipt[]> {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "announcement_reads.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Gagal membaca file read receipts:", err);
    return [];
  }
}

export async function addReadReceipt(
  announcementId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "announcement_reads.json");
  const receipts = await getReadReceipts();

  // Prevent duplicates
  const exists = receipts.some(
    (r) => r.announcementId === announcementId && r.userEmail === userEmail
  );
  if (exists) return;

  const newReceipt: ReadReceipt = {
    announcementId,
    userEmail,
    userName,
    timestamp: Date.now(),
  };

  receipts.push(newReceipt);

  try {
    fs.writeFileSync(filePath, JSON.stringify(receipts, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menulis file read receipts:", err);
  }
}
