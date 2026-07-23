"use client";

import { useCompanyProfile } from "./useCompanyProfile";

export function useCompanyLogo() {
  const profile = useCompanyProfile();
  return profile.logo;
}

export function useCompanyName() {
  const profile = useCompanyProfile();
  return profile.name;
}
