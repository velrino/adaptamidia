import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { SetMetadataTitle } from "@/app/utils/metadata";
import CompaniesTable from "@/components/companies/CompaniesTable/CompaniesTable";

export const metadata: Metadata = {
  title: SetMetadataTitle("Empresas"),
  description: "Gerencie os clientes ",
};

export default function CompaniesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Empresas" />
      <div className="space-y-5 sm:space-y-6">
        <CompaniesTable />
      </div>
    </div>
  );
}
