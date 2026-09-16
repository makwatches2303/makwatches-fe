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
      // A token has to exist before /me is worth asking.
      const token =
        localStorage.getItem("customerToken") ||
        localStorage.getItem("adminToken");

      if (!token) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const res = await api.get("/me");
      const backendUser = res.data.data;
      const frontendUser = normalizeUser(backendUser);
      setUser(frontendUser);
      setRole(normalizeRole(frontendUser.role));
    } catch (error) {
      /*
        "The server rejected this session" and "I could not reach the server"
        are different answers, and were being treated as the same one.

        Only a 401/403 means the token is actually no longer good. Everything
        else -- the API being down, a dropped connection, a 500 -- says nothing
        about the session, and clearing it there signed a customer out of the
        UI over a momentary blip while their token was still perfectly valid.
        The stored token is left alone in that case; any request that genuinely
        needs it will surface its own failure.

        Nothing is logged with console.error either. This is a handled,
        expected branch, and console.error raises Next's full-screen dev error
        overlay -- which is what put an "AxiosError: Network Error" card over
        the whole site whenever the API was not running locally.
      */
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401 || status === 403) {
        setUser(null);
        setRole(null);
      } else if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[AuthContext] Could not verify the session; keeping it until the API answers."
        );
      }
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
    
    if (token) {
      // Ensure localStorage is in sync with cookies
      const localCustomerToken = localStorage.getItem("customerToken");
      const localAdminToken = localStorage.getItem("adminToken");
      const localToken = localCustomerToken || localAdminToken;
      
      if (!localToken) {
        const tokenKey = customerToken ? "customerToken" : "adminToken";
        localStorage.setItem(tokenKey, token);
      }
      
      fetchProfile();
    } else {
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
      // Allow admins to authenticate via this login form
      if (expectedNorm && userRole !== expectedNorm && !(expectedNorm === "customer" && userRole === "admin")) {
        throw new Error(`Invalid credentials for ${expectedNorm} login`);
      }
      const tokenKey = userRole === "admin" ? "adminToken" : "customerToken";
      Cookies.set(tokenKey, token, { expires: 7 });
      localStorage.setItem(tokenKey, token);
      if (userRole === "admin") {
        // Also sync customerToken and sessionStorage so storefront APIs and preview work seamlessly
        Cookies.set("customerToken", token, { expires: 7 });
        localStorage.setItem("customerToken", token);
        sessionStorage.setItem("adminAuthToken", token);
        try {
          localStorage.setItem("mak_admin_preview", "true");
        } catch {}
      }
      setRole(userRole);
      setUser(loggedInUser);

      const destination =
        safeRedirectTarget() ??
        (userRole === "admin" ? "/?admin_preview=true" : "/");

      /*
        A full-document replace, not `router.replace`.

        Two reasons, both measured rather than assumed:

          - **The client router cache outlives sign-in.** Next prefetches every
            <Link>, and the footer links to /orders on every page. Prefetched
            while signed out, that route answers 307 -> /login, and the router
            kept replaying that redirect *after* the customer signed in --
            which is the "clicking Orders bounces me to /login" bug. A document
            load starts a fresh router with an empty cache, so there is no
            stale redirect left to replay. (The middleware now also marks those
            redirects `no-store` + `Vary: Cookie`; this is the second line of
            defence, and the one that also fixes the point below.)
          - **`router.replace` was not reliably navigating here.** Driven in a
            real browser, the page stayed on /login after a successful sign-in.

        `replace` rather than `assign` so /login does not sit in history behind
        the destination -- Back then goes where the customer came from instead
        of to a sign-in page that would immediately bounce.

        The toast is handed to the existing `mak_auth_toast` flash slot, which
        the provider reads on mount, because a toast raised immediately before a
        document navigation is destroyed before anyone sees it. Nothing else is
        lost: cart and wishlist are persisted to localStorage.
      */
      try {
        sessionStorage.setItem(
          "mak_auth_toast",
          userRole === "admin"
            ? "Welcome back, Administrator! Signed in successfully."
            : "You have successfully signed in. Welcome back!"
        );
      } catch {
        // A missing greeting is not worth failing the sign-in over.
      }
      window.location.replace(destination);
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Sign in failed. Please try again."), {
        tone: "error",
      });

      // No console.error: the failure is already reported to the customer via
      // the toast above, and console.error raises Next's full-screen dev error
      // overlay -- so mistyping a password covered the site with an error card.

    }
  };

  const register = async (data: RegisterData, regRole: UserRole) => {
    try {
      if (!regRole) throw new Error("Role not specified for registration");
      const backendRole = mapRoleForBackend(regRole);
      const payload = { ...data, role: backendRole };
      // Deliberately not logged. `payload` carries the plaintext password, and
      // the response carries the freshly issued JWT -- neither belongs in a
      // console, including in development, where it is read over shoulders and
      // captured in screen recordings.
      await api.post("/auth/register", payload);
      await login(data.email, data.password, regRole); // auto login with explicit role
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Registration failed. Please try again."), {
        tone: "error",
      });

      // As with login: the customer already has the toast, and console.error
      // would raise the full-screen dev overlay over a handled outcome such as
      // "that email is already registered".

    }
  };

  const logout = () => {
    // Clear both unconditionally, never just the one matching `role`.
    // An admin-role account holds both cookies (see login() above and
    // auth/callback/page.tsx), so removing only "adminToken" left
    // "customerToken" behind -- middleware would still treat the session as
    // live and "log out" would appear to do nothing. Clearing a cookie that
    // was never set is a no-op, so this is safe for a plain customer too.
    Cookies.remove("customerToken");
    Cookies.remove("adminToken");
    try {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminAuthToken");
    } catch {
      // ignore storage errors
    }
    setUser(null);
    setRole(null);

    /*
      A full-document replace, not a client-side route change.

      Three things had to be true at once, and only this gets all three:

      - **It must actually navigate.** `router.replace("/")` followed by
        `router.refresh()` did not: the refresh aborts the pending transition,
        so the visitor stayed on /account staring at the signed-out empty
        state. Measured in a browser -- the path never left /account across ten
        seconds of sampling.
      - **Nothing stale may survive.** A hard load rebuilds the React tree and
        discards Next's client router cache, so there is no cached server
        render of an authenticated page left to walk back into.
      - **Back must be safe.** `replace` writes over the current history entry
        instead of pushing a new one, so Back skips the page they just signed
        out of rather than returning to it.

      Nothing is lost by reloading: the cart and wishlist are zustand stores
      persisted to localStorage ("mak-cart" / wishlist), and the clear above
      touches only the token keys -- so a guest keeps their bag across the
      sign-out.

      The confirmation is handed over through the existing `mak_auth_toast`
      flash slot rather than shown here, because a toast raised immediately
      before a document navigation is destroyed before anyone reads it. The
      provider picks it up on mount on the other side.

      Home rather than /login: signing out is not a request to sign in again,
      and the homepage is public so it can never bounce.
    */
    try {
      sessionStorage.setItem("mak_auth_toast", "You have been signed out.");
    } catch {
      // A missing confirmation is not worth failing the sign-out over.
    }
    window.location.replace("/");
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
