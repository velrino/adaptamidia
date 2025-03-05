import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { SetMetadataTitle } from "@/app/utils/metadata";
import AdvertisementsTable from "@/components/advertisements/AdvertisementsTable";

export const metadata: Metadata = {
  title: SetMetadataTitle("Anúncios"),
  description: "Gerencie os anúncios",
};

export default function AdvertisingPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Anúncios" />
      <div className="space-y-5 sm:space-y-6">
        <AdvertisementsTable />
      </div>
    </div>
  );
}
