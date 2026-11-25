import { SetMetadataTitle } from "@/app/utils/metadata";
import UserProfile from "@/components/user-profile/UserProfile";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: SetMetadataTitle("Profile"),
  description: "Gerencie suas informações pessoais",
};

export default function Profile() {
  return <UserProfile />;
}
