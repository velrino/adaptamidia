"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback } from "react";
import { UserPermission } from "@/interfaces/permissions";

interface UserData {
  token: {
    id: string;
    iat: number;
    exp: number;
    expires_in: string;
  };
  user: {
    companies: any[];
    _id: string;
    email: string;
    permissions: string[];
    auth_type: string;
    otp: string;
    created_at: string;
    updated_at: string;
  };
}

interface UserContextType {
  userData: UserData | null;
  email: string;
  permissions: Set<string>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  setUserData: (data: UserData | null) => void;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  email: "",
  permissions: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  setUserData: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  
  const permissions = useMemo(() => {
    const userPerms = userData?.user?.permissions || [];
    // Always include SUDO in the permissions set for checking
    return new Set([...userPerms, UserPermission.SUDO]);
  }, [userData]);

  const email = userData?.user?.email || "";

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.has(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some(permission => permissions.has(permission));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    return perms.every(permission => permissions.has(permission));
  }, [permissions]);

  const setUserData = useCallback((data: UserData | null) => {
    setUserDataState(data);
  }, []);

  return (
    <UserContext.Provider
      value={{
        userData,
        email,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        setUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);