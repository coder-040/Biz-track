"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  BusinessRole,
  PermissionOverrides,
} from "@/lib/auth/permissions";

interface ClientBusinessOption {
  id: string;
  name: string;
  role: BusinessRole;
  permissions: PermissionOverrides;
}

export interface ClientBusinessContext {
  user: { id: string; email: string; fullName: string };
  memberships: ClientBusinessOption[];
  activeBusinessId: string | null;
  activeBusinessName: string | null;
  activeRole: BusinessRole | null;
  activePermissions: PermissionOverrides;
}

interface BusinessContextValue {
  context: ClientBusinessContext | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

async function fetchBusinessContext(): Promise<ClientBusinessContext> {
  const response = await fetch("/api/account/context", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session has expired. Log in again."
        : "Could not load your business account.",
    );
  }
  return (await response.json()) as ClientBusinessContext;
}

export function BusinessContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [context, setContext] = useState<ClientBusinessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContext(await fetchBusinessContext());
    } catch (loadError) {
      setContext(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your business account.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchBusinessContext()
      .then((value) => {
        if (active) setContext(value);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setContext(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your business account.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <BusinessContext.Provider value={{ context, loading, error, refresh }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext(): BusinessContextValue {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinessContext must be used within the provider.");
  }
  return context;
}
