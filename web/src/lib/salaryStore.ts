export type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
  createdByAdminId: string;
};

type SalaryStore = {
  records: SalaryRecord[];
};

declare global {
  // eslint-disable-next-line no-var
  var __salaryStore: SalaryStore | undefined;
}

function getStore(): SalaryStore {
  if (!globalThis.__salaryStore) {
    globalThis.__salaryStore = {
      records: [],
    };
  }

  return globalThis.__salaryStore;
}

export function listSalaryRecords() {
  return [...getStore().records].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function saveSalaryRecord(
  input: Omit<SalaryRecord, "id" | "createdAt">,
) {
  const record: SalaryRecord = {
    ...input,
    id: `SAL-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };

  getStore().records.unshift(record);
  return record;
}
