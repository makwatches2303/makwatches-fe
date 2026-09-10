"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FiBarChart,
  FiSettings,
  FiLogOut,
  FiUsers,
  FiFolder,
  FiPackage,
  FiShoppingBag,
  FiHome,
  FiLayout,
} from "react-icons/fi";
import { COLORS } from "./colors";

const navLinks = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <FiBarChart />,
    description: "Overview & Analytics",
  },
  {
    name: "Home Content",
    href: "/admin/dashboard/home",
    icon: <FiHome />,
    description: "Manage homepage sections",
  },
  {
    name: "Storefront",
    href: "/admin/dashboard/storefront",
    icon: <FiLayout />,
    description: "Navigation, tiles & sections",
  },
  {
    name: "Categories",
    href: "/admin/dashboard/categories",
    icon: <FiFolder />,
    description: "Manage Categories",
  },
  {
    name: "Products",
    href: "/admin/dashboard/products",
    icon: <FiPackage />,
    description: "Product Management",
  },
  {
    name: "Orders",
    href: "/admin/dashboard/orders",
    icon: <FiShoppingBag />,
    description: "Order Processing",
  },
  {
    name: "Users",
    href: "/admin/dashboard/customers",
    icon: <FiUsers />,
    description: "Customer Management",
  },
  {
    name: "Settings",
    href: "/admin/dashboard/settings",
    icon: <FiSettings />,
    description: "System Settings",
  },
];

// Professional Loading Component
const LoadingSpinner = () => (
  <div
    className="flex items-center justify-center min-h-screen transition-all duration-500"
    style={{ backgroundColor: COLORS.background }}
  >
    {/* Animated Background Elements */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5 animate-pulse"
        style={{ backgroundColor: COLORS.primary }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-3 animate-pulse"
        style={{ backgroundColor: COLORS.secondary }}
      />
    </div>

    <div className="relative flex flex-col items-center space-y-8">
      {/* Main Spinner */}
      <div className="relative">
        <div
          className="w-20 h-20 border-4 rounded-full animate-spin"
          style={{
            borderColor: `${COLORS.secondary}40`,
            borderTopColor: COLORS.primary,
          }}
        />
        <div
          className="absolute inset-0 w-20 h-20 border-2 rounded-full animate-ping opacity-20"
          style={{ borderColor: COLORS.primary }}
        />
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-3">
        <h2
          className="text-2xl font-bold animate-pulse"
          style={{ color: COLORS.primary }}
        >
          Verifying Access
        </h2>
        <p
          className="text-base font-medium animate-pulse"
          style={{ color: COLORS.textMuted }}
        >
          Please wait while we authenticate your admin privileges...
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full animate-bounce"
            style={{
              backgroundColor: COLORS.secondary,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();

  // While AuthContext is still reading the token, show the spinner -- role
  // hasn't resolved yet, so it isn't safe to say "not admin" either way.
  // Once it *has* resolved and the visitor genuinely isn't an admin, send
  // them to the login page instead of leaving them on a spinner that never
  // stops (this used to be the only gate on /admin/dashboard/*, and it
  // never actually turned visitors away -- see src/middleware.ts for the
  // route-level gate that now runs before this component even mounts).
  useEffect(() => {
    if (!loading && role !== "admin") {
      router.replace("/admin/login");
    }
  }, [loading, role, router]);

  if (loading || role !== "admin") {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen relative flex flex-col transition-all duration-500"
      style={{ backgroundColor: COLORS.surface }}
    >
      {/* Refined Header - More compact with better spacing */}
      <header
        className="flex px-4 sm:px-4 py-4 shadow-sm fixed top-0 z-50 border-b transition-all duration-300 min-w-screen"
        style={{
          backgroundColor: COLORS.background,
          borderColor: `${COLORS.surfaceLight}60`,
          boxShadow: `0 1px 8px ${COLORS.primary}08`,
        }}
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Toggle - More refined */}
          <button
            className="md:hidden p-1.5 rounded-lg transition-all duration-300 hover:scale-105 group"
            style={{
              backgroundColor: `${COLORS.primary}10`,
              color: COLORS.primary,
            }}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.primary}20`;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.primary}10`;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span className="text-base font-bold group-hover:rotate-6 transition-transform duration-300">
              ≡
            </span>
          </button>

          {/* Logo/Title - More compact */}
          <div className="flex items-center space-x-1.5">
            <div
              className="w-1 h-6 sm:h-7 rounded-full"
              style={{ backgroundColor: COLORS.primary }}
            />
            <div>
              <h1
                className="text-base sm:text-lg font-bold tracking-tight hover:tracking-wide transition-all duration-300"
                style={{ color: COLORS.primary }}
              >
                Admin Panel
              </h1>
              <div
                className="w-10 h-0.5 rounded-full transition-all duration-500 hover:w-16"
                style={{ backgroundColor: COLORS.secondary }}
              />
            </div>
          </div>
        </div>

        {/* Profile Section - More refined */}
        <div className="flex item-end justify-end flex-1 space-x-2 sm:space-x-3">
          <div className="hidden sm:block text-right">
            <p
              className="text-xs font-semibold leading-tight"
              style={{ color: COLORS.text }}
            >
              Welcome back
            </p>
            <p
              className="text-xs leading-tight"
              style={{ color: COLORS.textMuted }}
            >
              {user?.name || user?.email || "Admin"}
            </p>
          </div>
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-105 hover:rotate-3 shadow-sm hover:shadow-md cursor-pointer"
            style={{ backgroundColor: COLORS.primary }}
          >
            {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar - Narrower and better organized */}
        <aside
          className={
            `fixed md:static top-0 left-0 h-screen md:h-auto w-60 shadow-md transform transition-all duration-500 ease-in-out border-r
            ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0
            ${sidebarOpen ? "z-60 md:z-40" : "z-40"}` // z-60 only on mobile when open
          }
          style={{
            backgroundColor: COLORS.background,
            borderColor: `${COLORS.surfaceLight}60`,
            overflow: "hidden",
          }}
        >
          {/* Sidebar Header - More concise */}
          <div
            className="p-3 border-b"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: `${COLORS.surfaceLight}60`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${COLORS.primary}20` }}
                >
                  <span className="text-sm">🏪</span>
                </div>
                <div>
                  <h3
                    className="font-bold text-xs sm:text-sm"
                    style={{ color: COLORS.primary }}
                  >
                    Admin Portal
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    Management Console
                  </p>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                className="md:hidden p-1.5 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
                style={{
                  backgroundColor: `${COLORS.error}20`,
                  color: COLORS.error,
                }}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <span className="text-base font-bold">×</span>
              </button>
            </div>
          </div>

          {/* Navigation Links - Better spacing and sizing */}
          <nav className="flex flex-col p-2 md:pt-10 pt-6 space-y-6 h-full">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative p-2 rounded-lg font-medium transition-all duration-300 hover:scale-102 cursor-pointer border ${
                    isActive ? "shadow-sm" : "hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? `${COLORS.primary}15`
                      : "transparent",
                    color: isActive ? COLORS.primary : COLORS.text,
                    borderColor: isActive
                      ? `${COLORS.primary}40`
                      : "transparent",
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${COLORS.surface}80`;
                      e.currentTarget.style.borderColor = `${COLORS.surfaceLight}80`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{ backgroundColor: COLORS.primary }}
                    />
                  )}

                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                        isActive ? "shadow-sm" : ""
                      }`}
                      style={{
                        backgroundColor: isActive
                          ? `${COLORS.primary}25`
                          : `${COLORS.surface}80`,
                      }}
                    >
                      <span className="text-sm">{link.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-xs sm:text-sm truncate group-hover:text-opacity-80 transition-all duration-300"
                        style={{
                          color: isActive ? COLORS.primary : COLORS.text,
                        }}
                      >
                        {link.name}
                      </div>
                      <div
                        className="text-xs opacity-70 truncate"
                        style={{
                          color: isActive ? COLORS.primary : COLORS.textMuted,
                        }}
                      >
                        {link.description}
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect - More subtle */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-lg"
                    style={{
                      background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryLight})`,
                    }}
                  />
                </Link>
              );
            })}

            {/* Logout Button - More compact */}
            <div className="pt-0">
              <button
                className="w-full group p-2 rounded-lg font-medium transition-all duration-300 hover:scale-102 text-left border hover:shadow-sm"
                style={{
                  backgroundColor: `${COLORS.error}10`,
                  color: COLORS.error,
                  borderColor: `${COLORS.error}20`,
                }}
                onClick={logout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.error}20`;
                  e.currentTarget.style.borderColor = `${COLORS.error}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.error}10`;
                  e.currentTarget.style.borderColor = `${COLORS.error}20`;
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${COLORS.error}20` }}
                  >
                    <span className="text-sm">
                      <FiLogOut />
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs sm:text-sm">
                      Logout
                    </div>
                    <div className="text-xs opacity-70">Sign out securely</div>
                  </div>
                </div>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content - Move up by reducing top padding */}
        <main
          className="flex-1 transition-all duration-500 w-full overflow-x-hidden"
          style={{ backgroundColor: COLORS.background }}
        >
          <div className="pt-1 pb-2 px-2 sm:px-3 md:px-4">{children}</div>
        </main>

        {/* Mobile Overlay - Improved backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Improved animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
