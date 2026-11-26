"use client";

import { createContext, useContext, type ReactNode } from "react";

type RegisterNavbarAction = (
  id: string,
  action: ReactNode | null,
) => void;

export const NavbarActionContext =
  createContext<RegisterNavbarAction | null>(null);

export function useRegisterNavbarAction(): RegisterNavbarAction {
  const registerAction = useContext(NavbarActionContext);
  if (!registerAction) {
    throw new Error("Navbar actions must be registered inside the AppShell.");
  }
  return registerAction;
}
