"use client";

import { IApiUserResponse } from "@/backend/api/api.interface";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { UserMock } from "@/interfaces/user.interface";
import React, { useEffect, useState } from "react";

export default function UserProfile() {
  const [authenticated, setAuthenticated] = useState<IApiUserResponse>();

  useEffect(() => {
    setAuthenticated(UserMock);
  }, []);

  return (
    <>
      {authenticated && (
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
              Profile
            </h3>
            <div className="space-y-6">
              <UserMetaCard authenticated={authenticated} />
              <UserInfoCard authenticated={authenticated} />
              <UserAddressCard />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
