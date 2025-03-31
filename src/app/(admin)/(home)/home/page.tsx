import type { Metadata } from "next";
import React from "react";

import { getServerAuthSession } from "@/backend/authentication/auth";
import HomeComponent from "@/components/home/Home";
import { SetMetadataTitle } from "@/app/utils/metadata";

export const metadata: Metadata = {
  title: SetMetadataTitle("Dashboard"),
  description: "Gerencie tudo",
};

export default async function Ecommerce() {
  const authSession = await getServerAuthSession();
  console.log({ authSession });
  return <HomeComponent />;
}
