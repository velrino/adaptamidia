import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { SetMetadataTitle } from "@/app/utils/metadata";
import DisplaysTable from "@/components/displays/DisplaysTable";

export const metadata: Metadata = {
  title: SetMetadataTitle("Exibições"),
  description: "Gerencie as exibições",
};

export default function DisplayPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Exibições" />
      <div className="space-y-5 sm:space-y-6">
        <DisplaysTable />
      </div>
    </div>
  );
}
