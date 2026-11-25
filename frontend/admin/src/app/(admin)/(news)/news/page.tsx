import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";
import { SetMetadataTitle } from "@/app/utils/metadata";
import NewsTable from "@/components/news/table/NewsTable";

export const metadata: Metadata = {
  title: SetMetadataTitle("Notícias"),
  description: "Gerencie as notícias",
};

export default function NewsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Notícias" />
      <div className="space-y-5 sm:space-y-6">
        <NewsTable />
      </div>
    </div>
  );
}
