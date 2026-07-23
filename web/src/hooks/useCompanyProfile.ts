"use client";

import { useEffect, useState } from "react";

const DEFAULT_COMPANY_NAME = "Creativemu";
const DEFAULT_COMPANY_LOGO = "/images/creativemu-logo/creativemu.png";

export type CompanyProfileState = {
  name: string;
  logo: string;
};

export function useCompanyProfile(): CompanyProfileState {
  const [profile, setProfile] = useState<CompanyProfileState>({
    name: DEFAULT_COMPANY_NAME,
    logo: DEFAULT_COMPANY_LOGO,
  });

  useEffect(() => {
    function updateProfile() {
      if (typeof window === "undefined") return;
      const cachedName = localStorage.getItem("faceattend_company_name");
      const cachedLogo = localStorage.getItem("faceattend_company_logo");
      setProfile((prev) => ({
        name: cachedName || prev.name,
        logo: cachedLogo || prev.logo,
      }));
    }

    updateProfile();

    async function fetchCompanyProfile() {
      try {
        const res = await fetch("/api/offices/active", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.offices && data.offices.length > 0) {
          const office = data.offices[0];
          const fetchedName = office.name;
          const fetchedLogo = office.logo_url || office.logoUrl;

          if (fetchedName) {
            localStorage.setItem("faceattend_company_name", fetchedName);
          }
          if (fetchedLogo) {
            localStorage.setItem("faceattend_company_logo", fetchedLogo);
          }

          setProfile({
            name: fetchedName || DEFAULT_COMPANY_NAME,
            logo: fetchedLogo || DEFAULT_COMPANY_LOGO,
          });
        }
      } catch {
        // ignore
      }
    }

    void fetchCompanyProfile();

    const handleUpdate = () => {
      updateProfile();
      void fetchCompanyProfile();
    };

    window.addEventListener("company_profile_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("company_profile_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return profile;
}
