import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

import React from "react";

export const metadata: Metadata = {
  title: "Next.js Reset Password | XMP Midia - Next.js Dashboard Template",
  description:
    "This is Next.js Password Reset page for XMP Midia Dashboard Template",
  // other metadata
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
