"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { useToast } from "@/design-system";
import { getErrorMessage } from "@/lib/errors";

type UserRole = "customer" | "admin" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  // Add other user fields as needed
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  // Add other fields as needed
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register?: (data: RegisterData, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Backend user type for normalization
interface BackendUser {
  ID?: string;
  id?: string;
  Name?: string;
  name?: string;
  Email?: string;
  email?: string;
  Role?: string;
  role?: string;
  // Add other backend fields as needed
}

/**
 * The `?redirect=` destination, when it is safe to honour.
 *
 * Only same-origin, absolute paths are accepted. A protocol-relative value
 * ("//evil.example") is a real open-redirect: the browser treats it as another
 * host, so requiring a leading "/" is not enough on its own.
 */
function safeRedirectTarget(): string | null {
  if (typeof window === "undefined") return null;
  const target = new URLSearchParams(window.location.search).get("redirect");
  if (!target) return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}

// Utility to convert backend user shape to frontend User
const normalizeUser = (backendUser: BackendUser): User => ({
  id: backendUser.ID || backendUser.id || "",
  name: backendUser.Name || backendUser.name || "",
  email: backendUser.Email || backendUser.email || "",
  role: backendUser.Role || backendUser.role || "",
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const normalizeRole = (value: unknown): UserRole => {
    if (!value) return null;
    const r = String(value)
      .trim()
      .toLowerCase()
      .replace(/^role_/, "");
    if (["admin", "administrator"].includes(r)) return "admin";
    if (["customer", "user", "client"].includes(r)) return "customer";
    return null;
  };

  // Map frontend role to backend expected value (adjust if backend differs)
  const mapRoleForBackend = (r: UserRole): string | undefined => {
    if (!r) return undefined;
    // Common backend variants: admin / customer
    if (r === "admin") return "admin";
    if (r === "customer") return "customer";
    return (r as string).toLowerCase();
  };

  const fetchProfile = useCallback(async () => {
    try {
      console.log("[AuthContext] Fetching profile...");
      // Ensure we have a token before making the request
      const customerToken = localStorage.getItem("customerToken");
      const adminToken = localStorage.getItem("adminToken");
      const token = customerToken || adminToken;
      
      if (!token) {
        console.warn("[AuthContext] No token found in localStorage, skipping profile fetch");
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      
      console.log("[AuthContext] Token found, fetching /me");
      const res = await api.get("/me");
      const backendUser = res.data.data;
      const frontendUser = normalizeUser(backendUser);
      setUser(frontendUser);
      setRole(normalizeRole(frontendUser.role));
      console.log("[AuthContext] Profile fetched successfully:", frontendUser);
    } catch (error) {
      console.error("[AuthContext] Error fetching profile:", error);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for flash toast set before redirects (such as OAuth callbacks)
    if (typeof window !== "undefined") {
      try {
        const flash = sessionStorage.getItem("mak_auth_toast");
        if (flash) {
          sessionStorage.removeItem("mak_auth_toast");
          setTimeout(() => {
            toast(flash, { tone: "success" });
          }, 150);
        }
      } catch {
        // ignore storage errors
      }
    }

    const customerToken = Cookies.get("customerToken");
    const adminToken = Cookies.get("adminToken");
    const token = customerToken || adminToken;
    
    console.log("[AuthContext] useEffect - Checking for tokens");
    console.log("[AuthContext] Cookie token:", token ? "exists" : "missing");
    
    if (token) {
      // Ensure localStorage is in sync with cookies
      const localCustomerToken = localStorage.getItem("customerToken");
      const localAdminToken = localStorage.getItem("adminToken");
      const localToken = localCustomerToken || localAdminToken;
      
      if (!localToken) {
        console.log("[AuthContext] Syncing cookie token to localStorage");
        const tokenKey = customerToken ? "customerToken" : "adminToken";
        localStorage.setItem(tokenKey, token);
      }
      
      fetchProfile();
    } else {
      console.log("[AuthContext] No token found, user not authenticated");
      setRole(null);
      setUser(null);
      setLoading(false);
    }
  }, [fetchProfile, toast]);

  const login = async (
    email: string,
    password: string,
    expectedRole: UserRole
  ) => {
    try {
      if (!expectedRole) throw new Error("Role not specified for login");
      const res = await api.post("/auth/login", {
        email,
        password,
        role: mapRoleForBackend(expectedRole),
      });
      const payload = res.data?.data; // { user, token }
      if (!payload || !payload.user || !payload.token) {
        throw new Error("Login response missing user or token");
      }
      const loggedInUser = normalizeUser(payload.user);
      const token = payload.token as string;
      const userRole = normalizeRole(loggedInUser.role);
      if (!userRole) throw new Error("Login response missing user role");
      const expectedNorm = normalizeRole(expectedRole);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "Login debug => backend role:",
          loggedInUser.role,
          "normalized:",
          userRole,
          "expected:",
          expectedNorm
        );
      }
      if (userRole !== expectedNorm) {
        throw new Error(`Invalid credentials for ${expectedNorm} login`);
      }
      const tokenKey = userRole === "admin" ? "adminToken" : "customerToken";
      Cookies.set(tokenKey, token, { expires: 7 });
      localStorage.setItem(tokenKey, token);
      if (userRole === "admin") {
        sessionStorage.setItem("adminAuthToken", token);
      }
      setRole(userRole);
      setUser(loggedInUser);
      toast("You have successfully signed in. Welcome back!", { tone: "success" });
      if (userRole === "customer") {
        // Come back to where they were sent from -- someone who was asked to
        // sign in partway through checkout should land back on checkout, not
        // the homepage, with their bag still in front of them.
        router.replace(safeRedirectTarget() ?? "/");
      } else {
        // Admin has its own separate app now; this storefront has no admin
        // area of its own to send them to.
        router.replace("/");
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(`Redirected to ${userRole === "customer" ? safeRedirectTarget() ?? "/" : "/"}`);
      }
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Sign in failed. Please try again."), {
        tone: "error",
      });

      if (typeof error === "object" && error !== null && "response" in error) {
        const errObj = error as {
          response?: { data?: unknown };
          message?: string;
        };
        console.error("Login failed:", errObj.response?.data || errObj.message);
      } else {
        console.error("Login failed:", error);
      }
    }
  };

  const register = async (data: RegisterData, regRole: UserRole) => {
    try {
      if (!regRole) throw new Error("Role not specified for registration");
      const backendRole = mapRoleForBackend(regRole);
      const payload = { ...data, role: backendRole };
      if (process.env.NODE_ENV !== "production") {
        console.log("Register request payload:", payload);
      }
      const res = await api.post("/auth/register", payload);
      if (process.env.NODE_ENV !== "production") {
        console.log("Register response:", res.data);
      }
      await login(data.email, data.password, regRole); // auto login with explicit role
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Registration failed. Please try again."), {
        tone: "error",
      });

      if (typeof error === "object" && error !== null && "response" in error) {
        console.error(
          "Register failed: ",
          (error.response as { data?: unknown })?.data ||
            (error instanceof Error ? error.message : String(error))
        );
      } else {
        console.error("Register failed:", error);
      }
    }
  };

  const logout = () => {
    if (role) {
      const tokenKey = role === "customer" ? "customerToken" : "adminToken";
      Cookies.remove(tokenKey);
      localStorage.removeItem(tokenKey);
      if (role === "admin") {
        sessionStorage.removeItem("adminAuthToken");
      }
    }
    setUser(null);
    setRole(null);
    // Admin has its own separate app now; there is no /admin/login here.
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
