"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, clearTokens, getAccessToken, setTokens } from "@/lib/api-client";
import type { CurrentUserOut, OrganizationOut, Permission, UserOut } from "@/types/api";

interface AuthContextValue {
  user: UserOut | null;
  organization: OrganizationOut | null;
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, organizationName: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserOut | null>(null);
  const [organization, setOrganization] = useState<OrganizationOut | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      // Auto-initialize demo mode silently so guest visitors land on live demo dashboard
      try {
        const response = await api.post<{ tokens: { access_token: string; refresh_token: string } }>(
          "/auth/login",
          { email: "demo@insightiq.io", password: "DemoPass123!" }
        );
        setTokens(response.tokens.access_token, response.tokens.refresh_token);
        const me = await api.get<CurrentUserOut>("/auth/me");
        setUser(me.user);
        setOrganization(me.organization);
        setPermissions(me.permissions);
        setIsGuest(true);
      } catch {
        setUser(null);
        setOrganization(null);
        setPermissions([]);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const me = await api.get<CurrentUserOut>("/auth/me");
      setUser(me.user);
      setOrganization(me.organization);
      setPermissions(me.permissions);
      // Check if logged in as the demo user or a registered account
      setIsGuest(me.user.email === "demo@insightiq.io");
    } catch {
      clearTokens();
      setUser(null);
      setOrganization(null);
      setPermissions([]);
      setIsGuest(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ tokens: { access_token: string; refresh_token: string }; user: UserOut; organization: OrganizationOut }>(
        "/auth/login",
        { email, password },
      );
      setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setIsGuest(email === "demo@insightiq.io");
      await loadCurrentUser();
      router.push("/dashboard");
    },
    [loadCurrentUser, router],
  );

  const signup = useCallback(
    async (email: string, password: string, fullName: string, organizationName: string) => {
      const response = await api.post<{ tokens: { access_token: string; refresh_token: string }; user: UserOut; organization: OrganizationOut }>(
        "/auth/signup",
        { email, password, full_name: fullName, organization_name: organizationName },
      );
      setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setIsGuest(false);
      await loadCurrentUser();
      router.push("/dashboard");
    },
    [loadCurrentUser, router],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setOrganization(null);
    setPermissions([]);
    setIsGuest(true);
    // Reload as demo guest
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const hasPermission = useCallback((permission: Permission) => permissions.includes(permission), [permissions]);

  const value = useMemo(
    () => ({
      user,
      organization,
      permissions,
      isLoading,
      isAuthenticated: Boolean(user),
      isGuest,
      hasPermission,
      login,
      signup,
      logout,
      refetchUser: loadCurrentUser,
    }),
    [user, organization, permissions, isLoading, isGuest, hasPermission, login, signup, logout, loadCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
