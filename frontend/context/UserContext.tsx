'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getAccount } from "../contracts/query";
import { User } from "@/types/display";
import { accountToUser } from "@/utils/dataTransformers";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: (address: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await getAccount(address);
      if (!account) {
        // 用户还没有创建账户
        setUser(null);
        return;
      }
      console.log("account", account);
    const user = await accountToUser(account);
      console.log("user", user);
      setUser(user);
    } catch (error) {
      console.log(error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }

  


  const value = useMemo(() => ({ user, isLoading, error, refreshUser }), [user, isLoading, error]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
