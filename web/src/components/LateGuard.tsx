"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import LateReasonModal from "./LateReasonModal";

export default function LateGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [scheduledCheckIn, setScheduledCheckIn] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [lateMinutes, setLateMinutes] = useState(0);
  const [lateSeconds, setLateSeconds] = useState(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Skip checking on login page, landing page, and admin panel paths
    if (
      pathname === "/login" ||
      pathname.startsWith("/admin") ||
      pathname === "/"
    ) {
      setOpen(false);
      return;
    }

    async function checkLateness() {
      try {
        const res = await fetch("/api/attendance/late-reason", {
          method: "GET",
          cache: "no-store",
        });
        
        if (res.status === 401) {
          setOpen(false);
          router.replace("/login");
          return;
        }
        
        if (res.status === 403) {
          setOpen(false);
          return;
        }

        const result = await res.json();
        
        if (result.success && result.data) {
          const { 
            isLate, 
            hasReason, 
            employeeName, 
            scheduledCheckIn, 
            checkInTime, 
            lateMinutes, 
            lateSeconds 
          } = result.data;

          if (isLate && !hasReason) {
            setEmployeeName(employeeName || "");
            setScheduledCheckIn(scheduledCheckIn || "");
            setCheckInTime(checkInTime || "");
            setLateMinutes(lateMinutes || 0);
            setLateSeconds(lateSeconds || 0);
            setOpen(true);
          } else {
            setOpen(false);
          }
        }
      } catch (error) {
        console.error("Error checking lateness status:", error);
      }
    }

    void checkLateness();
  }, [pathname]);

  async function handleSubmitReason() {
    if (!reason.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/attendance/late-reason", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.message || "Gagal menyimpan alasan keterlambatan.");
        return;
      }

      setOpen(false);
      setReason("");
      
      // Reload page to refresh all attendance status displays
      window.location.reload();
    } catch (error) {
      console.error("Error submitting late reason:", error);
      alert("Terjadi kesalahan koneksi saat mengirim alasan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <LateReasonModal
      open={open}
      employeeName={employeeName}
      scheduledCheckIn={scheduledCheckIn}
      checkInTime={checkInTime}
      lateMinutes={lateMinutes}
      lateSeconds={lateSeconds}
      reason={reason}
      isSubmitting={isSubmitting}
      onReasonChange={setReason}
      onSubmit={handleSubmitReason}
    />
  );
}
