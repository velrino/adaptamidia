import { SetMetadataTitle } from "@/app/utils/metadata";
import AdsComponent from "@/components/advertisements/Ads/Ads";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: SetMetadataTitle("Anúncios"),
  description: "Exibindo os Anúncios",
};

export default function AdsPage() {
  return <AdsComponent />;
}
