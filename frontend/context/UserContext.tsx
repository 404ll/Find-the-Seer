'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Account } from "../types/raw";
import { getAccount } from "../contracts/query";

interface UserContextType {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
  refreshAccount: (address: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccount = async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await getAccount(address);
      console.log(account);
      setAccount(account);
    } catch (error) {
      console.log(error);
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  }

  


  const value = useMemo(() => ({ account, isLoading, error, refreshAccount }), [account, isLoading, error]);

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
