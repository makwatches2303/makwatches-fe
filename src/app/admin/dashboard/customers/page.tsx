"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/design-system";
import { getErrorMessage } from "@/lib/errors";
import { COLORS } from "../colors";

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/accounts");
      // Normalize id to string if it's an object
      type MongoId = { $oid: string };
      const normalized = res.data.map(
        (acc: Account & { id: string | MongoId }) => ({
          ...acc,
          id:
            typeof acc.id === "object" && (acc.id as MongoId).$oid
              ? (acc.id as MongoId).$oid
              : acc.id,
        })
      );
      setAccounts(normalized);
    } catch (error) {
      console.error("Error fetching accounts", error);
      toast(getErrorMessage(error, "Failed to load accounts."), {
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Account
  const handleDelete = async (id?: string) => {
    if (!id) {
      toast("Invalid account ID.", { tone: "error" });
      return;
    }
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/accounts/${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
      toast("Account deleted.", { tone: "success" });
    } catch (error) {
      console.error("Error deleting account", error);
      toast(getErrorMessage(error, "Failed to delete account."), {
        tone: "error",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter accounts by search
  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(search.toLowerCase()) ||
      account.email.toLowerCase().includes(search.toLowerCase())
  );

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { bg: "#FEF3C7", text: "#B45309" }; // Amber
      case "user":
      default:
        return { bg: "#DBEAFE", text: "#1E40AF" }; // Blue
    }
  };

  return (
    <div className="space-y-5 pt-18">
      {/* Header with animation */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center mb-3 group">
          <div
            className="w-1 h-8 rounded-full mr-3 transform group-hover:scale-y-110 transition-transform duration-300"
            style={{ backgroundColor: COLORS.primary }}
          />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 hover:tracking-wide transition-all duration-300"
              style={{ color: COLORS.primary }}
            >
              Customers
            </h1>
            <p
              className="text-xs sm:text-sm"
              style={{ color: COLORS.textMuted }}
            >
              Manage and monitor your user accounts
            </p>
          </div>
        </div>
        <div
          className="w-24 h-1 rounded-full transform hover:w-32 transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
          }}
        />
      </div>

      {/* Enhanced Search Bar and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlassIcon
            className="w-5 h-5 absolute top-2.5 left-3"
            style={{ color: COLORS.textMuted }}
          />
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full rounded-lg text-sm transition-all duration-300 focus:ring-2"
            style={{
              backgroundColor: COLORS.inputBg,
              borderColor: COLORS.inputBorder,
              border: `1px solid ${COLORS.inputBorder}`,
              color: COLORS.text,
              outline: "none",
            }}
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchAccounts}
          className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
          style={{ background: COLORS.primary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primaryDark;
            e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          <span>Refresh Accounts</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{
              borderColor: `${COLORS.secondary}40`,
              borderTopColor: COLORS.primary,
            }}
          />
          <p
            className="text-sm animate-pulse"
            style={{ color: COLORS.textMuted }}
          >
            Loading accounts...
          </p>
        </div>
      ) : (
        /* Enhanced Account List Table */
        <div
          className="rounded-xl shadow-md overflow-hidden border transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: COLORS.background,
            borderColor: `${COLORS.surfaceLight}60`,
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ backgroundColor: COLORS.primary }}>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-white">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-white">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-white hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center"
                      style={{ color: COLORS.textMuted }}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${COLORS.surfaceLight}50`,
                          }}
                        >
                          <UserGroupIcon
                            className="w-6 h-6"
                            style={{ color: COLORS.textMuted }}
                          />
                        </div>
                        <p className="text-sm">No accounts found</p>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="text-xs px-3 py-1 rounded-lg mt-2 transition-all duration-300 hover:scale-105"
                            style={{
                              color: COLORS.primary,
                              backgroundColor: `${COLORS.primary}10`,
                            }}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr
                      key={account.id ?? account.email}
                      className="border-b transition-all duration-300 hover:bg-gray-50 group"
                      style={{ borderColor: `${COLORS.surfaceLight}60` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                            style={{
                              backgroundColor: account.id
                                ? `${COLORS.secondary}40`
                                : `${COLORS.error}20`,
                            }}
                          >
                            <UserCircleIcon
                              className="w-4 h-4"
                              style={{
                                color: account.id
                                  ? COLORS.background
                                  : COLORS.error,
                              }}
                            />
                          </div>
                          <span
                            className="font-medium text-sm"
                            style={{ color: COLORS.text }}
                          >
                            {account.name || "Unnamed User"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-xs sm:text-sm font-mono"
                        style={{ color: COLORS.textMuted }}
                      >
                        {account.email}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: getRoleBadgeColor(account.role).bg,
                            color: getRoleBadgeColor(account.role).text,
                          }}
                        >
                          {account.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {!account.id && (
                            <div
                              className="flex items-center text-xs rounded-lg px-2 py-1"
                              style={{
                                backgroundColor: `${COLORS.error}15`,
                                color: COLORS.error,
                              }}
                            >
                              <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                              <span>No ID</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(account.id)}
                            disabled={!account.id}
                            className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50"
                            style={{
                              backgroundColor: `${COLORS.error}10`,
                              color: COLORS.error,
                            }}
                            title="Delete account"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
