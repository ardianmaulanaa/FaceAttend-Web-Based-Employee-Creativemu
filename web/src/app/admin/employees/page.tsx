import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const employees = [
  {
    id: "EMP001",
    name: "Muhammad Ardian Maulana",
    department: "IT",
    face: "Registered",
  },
  {
    id: "EMP002",
    name: "Budi Santoso",
    department: "Finance",
    face: "Not Registered",
  },
  {
    id: "EMP003",
    name: "Siti Rahma",
    department: "Marketing",
    face: "Registered",
  },
];

export default function EmployeesPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Employees"
        subtitle="Data karyawan Creativemu"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-100">
              Employee Management
            </p>
            <h2 className="mt-2 text-3xl font-black">Employee Data</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Kelola data karyawan dan status registrasi wajah.
            </p>
          </div>

          <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-900/20">
            Tambah Karyawan
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/40 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-[#123c8c]">
                    {employee.id}
                  </p>

                  <h3 className="mt-1 font-black text-slate-950">
                    {employee.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {employee.department}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    employee.face === "Registered"
                      ? "bg-[#eaf1ff] text-[#123c8c]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {employee.face}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}