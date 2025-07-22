"use client";

import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import AnalyticsMetrics from "@/components/analytics/AnalyticsMetrics";
import DisplayLogsChart from "@/components/analytics/DisplayLogsChart";
import TopChannel from "../analytics/TopChannel";
import TopPages from "../analytics/TopPages";
import ActiveUsersChart from "../analytics/ActiveUsersChart";
import TopRecords from "../analytics/TopRecords";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | Adapta Midia - Next.js Dashboard Template",
  description: "This is Next.js Home for Adapta Midia Dashboard Template",
};

export default function HomeComponent() {
  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <AnalyticsMetrics />
        </div>

        <div className="col-span-12">
          <DisplayLogsChart
            title="Distribuição Diária de Exibições"
            customQuery={{}}
            useFullRecords={false}
          />
        </div>

        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <TopRecords />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TopChannel />
            <TopPages />
          </div>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ActiveUsersChart />
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-4">
          <StatisticsChart />
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
