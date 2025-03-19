import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { SetMetadataTitle } from "@/app/utils/metadata";
import CompanieUnitsTable from "@/components/company-units/CompaniesUnitsTable/CompaniesUnitsTableTable";

export const metadata: Metadata = {
  title: SetMetadataTitle("Unidades"),
  description: "Gerencie as unidades",
};

export default function UnitsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Unidades das Empresas" />
      <div className="space-y-5 sm:space-y-6">
        <CompanieUnitsTable />
      </div>
    </div>
  );
}
