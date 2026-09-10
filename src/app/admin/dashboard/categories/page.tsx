"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import type { AxiosError } from "axios";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  FolderIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/design-system";
import { COLORS } from "../colors";

// Types
interface Subcategory {
  id: string;
  name: string;
  imageUrl?: string;
}
interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

// Using shared API client (baseURL + auth headers handled centrally)

const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMain, setActiveMain] = useState<"Men" | "Women">("Men");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{
    categoryId?: string;
    subId?: string;
  } | null>(null);
  const [formName, setFormName] = useState("");
  const [formMainCategory, setFormMainCategory] = useState<"Men" | "Women">(
    "Men"
  );
  const [submitting, setSubmitting] = useState(false);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [formExistingImageUrl, setFormExistingImageUrl] = useState<string>("");
  const [formImageCleared, setFormImageCleared] = useState<boolean>(false);

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/categories/`);
      if (res.data?.data) setCategories(res.data.data);
    } catch (err: unknown) {
      // Handle axios-like error objects safely
      const axErr = err as AxiosError<{ message?: string }>;
      const status = axErr?.response?.status;
      const message =
        axErr?.response?.data?.message ||
        axErr?.message ||
        "Failed to fetch categories";
      if (status === 401) {
        // Token invalid/expired or not admin; align with other pages
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("adminAuthToken");
          window.location.href = "/admin/login";
        }
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const currentCategory = categories.find((c) => c.name === activeMain);
  const subcategories = currentCategory?.subcategories || [];

  // Open Add Subcategory modal
  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormMainCategory(activeMain);
    setFormImageFile(null);
    setFormImagePreview("");
    setFormExistingImageUrl("");
    setFormImageCleared(false);
    setShowModal(true);
  };

  // Open Edit Subcategory modal
  const openEdit = (
    categoryId: string,
    subId: string,
    currentName: string,
    currentImageUrl?: string
  ) => {
    setEditing({ categoryId, subId });
    setFormName(currentName);
    setFormMainCategory(activeMain);
    setFormImageFile(null);
    setFormImagePreview("");
    setFormExistingImageUrl(currentImageUrl || "");
    setFormImageCleared(false);
    setShowModal(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("images", file);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = res.data?.data?.urls?.[0];
    if (!url) throw new Error("Image upload failed");
    return url as string;
  };

  // Handle create or edit submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      let imageUrlToUse: string | undefined = formExistingImageUrl;
      if (formImageFile) {
        imageUrlToUse = await uploadImage(formImageFile);
      }
      if (editing) {
        // Update subcategory name
        const payload: Record<string, unknown> = { name: formName };
        if (formImageCleared && !formImageFile) {
          // Explicitly clear image
          payload.imageUrl = "";
        } else if (imageUrlToUse !== undefined) {
          payload.imageUrl = imageUrlToUse;
        }
        await api.patch(
          `/admin/categories/${editing.categoryId}/subcategories/${editing.subId}`,
          payload
        );
      } else {
        // If category exists use add subcategory endpoint else create category
        const cat = categories.find((c) => c.name === formMainCategory);
        if (cat) {
          await api.post(`/admin/categories/${cat.id}/subcategories`, {
            name: formName,
            imageUrl: imageUrlToUse,
          });
        } else {
          await api.post(`/admin/categories/`, {
            name: formMainCategory,
            subcategories: [
              {
                name: formName,
                imageUrl: imageUrlToUse,
              },
            ],
          });
        }
      }
      await fetchCategories();
      setShowModal(false);
    } catch (err: unknown) {
      const axErr = err as AxiosError<{ message?: string }>;
      const status = axErr?.response?.status;
      const message =
        axErr?.response?.data?.message || axErr?.message || "Operation failed";
      if (status === 401) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("adminAuthToken");
          window.location.href = "/admin/login";
        }
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub = async (categoryId: string, subId: string) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      await api.delete(
        `/admin/categories/${categoryId}/subcategories/${subId}`
      );
      fetchCategories();
      toast("Subcategory deleted.", { tone: "success" });
    } catch (err: unknown) {
      const axErr = err as AxiosError<{ message?: string }>;
      const status = axErr?.response?.status;
      const message =
        axErr?.response?.data?.message || axErr?.message || "Delete failed";
      if (status === 401) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("adminAuthToken");
          window.location.href = "/admin/login";
        }
        return;
      }
      toast(message, { tone: "error" });
    }
  };

  return (
    <div className="space-y-6 pt-18">
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
              Categories
            </h1>
            <p
              className="text-xs sm:text-sm"
              style={{ color: COLORS.textMuted }}
            >
              Manage product categories and subcategories
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

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Enhanced Tabs */}
        <div
          className="flex gap-2 border-b"
          style={{ borderColor: `${COLORS.surfaceLight}80` }}
        >
          {(["Men", "Women"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMain(tab)}
              className={`px-4 py-2 -mb-px border-b-2 font-medium transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
                activeMain === tab
                  ? "border-b-2"
                  : "border-transparent hover:-translate-y-0.5"
              }`}
              style={
                activeMain === tab
                  ? { color: COLORS.primary, borderColor: COLORS.primary }
                  : { color: COLORS.textMuted }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Enhanced Add Button */}
        <button
          onClick={openAdd}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:-translate-y-0.5"
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
          <PlusIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          <span>Add Subcategory</span>
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
            Loading categories...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 py-4 px-3 rounded-lg bg-red-50 border border-red-100">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchCategories}
            className="ml-auto p-1.5 rounded-full hover:bg-red-100 transition-colors"
            title="Retry"
          >
            <ArrowPathIcon className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ) : (
        <div
          className="rounded-xl shadow-sm overflow-hidden border transition-all duration-300 hover:shadow-md"
          style={{
            backgroundColor: COLORS.background,
            borderColor: `${COLORS.surfaceLight}60`,
          }}
        >
          {/* Table Header */}
          <div
            className="px-4 py-3 border-b flex items-center"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: `${COLORS.surfaceLight}80`,
            }}
          >
            <div className="flex items-center space-x-2">
              <FolderIcon
                className="h-4 w-4"
                style={{ color: COLORS.primary }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: COLORS.text }}
              >
                {activeMain} Subcategories
              </h3>
            </div>
          </div>

          {/* Enhanced Table */}
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: `${COLORS.surface}30` }}>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Subcategory
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wider w-28"
                  style={{ color: COLORS.textMuted }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subcategories.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center"
                    style={{ color: COLORS.textMuted }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.surfaceLight}50` }}
                      >
                        <FolderIcon
                          className="h-6 w-6"
                          style={{ color: COLORS.textMuted }}
                        />
                      </div>
                      <p className="text-sm">No subcategories found</p>
                      <button
                        onClick={openAdd}
                        className="text-xs px-3 py-1 rounded-lg mt-2 transition-all duration-300 hover:scale-105"
                        style={{
                          color: COLORS.primary,
                          backgroundColor: `${COLORS.primary}10`,
                        }}
                      >
                        Add your first subcategory
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {subcategories.map((s) => (
                <tr
                  key={s.id}
                  className="transition-all duration-300 hover:bg-gray-50 group"
                  style={{ borderBottom: `1px solid ${COLORS.surfaceLight}60` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.imageUrl}
                          alt={s.name}
                          className="h-8 w-8 rounded object-cover border"
                          style={{ borderColor: `${COLORS.surfaceLight}80` }}
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center border"
                          style={{
                            borderColor: `${COLORS.surfaceLight}80`,
                            backgroundColor: `${COLORS.surfaceLight}30`,
                          }}
                        >
                          <FolderIcon
                            className="h-4 w-4"
                            style={{ color: COLORS.textMuted }}
                          />
                        </div>
                      )}
                      <span
                        className="font-medium group-hover:translate-x-0.5 transition-transform duration-300 inline-block"
                        style={{ color: COLORS.text }}
                      >
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openEdit(
                            currentCategory!.id,
                            s.id,
                            s.name,
                            s.imageUrl
                          )
                        }
                        className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: `${COLORS.primary}10` }}
                        aria-label="Edit"
                      >
                        <PencilIcon
                          className="h-3.5 w-3.5"
                          style={{ color: COLORS.primary }}
                        />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteSub(currentCategory!.id, s.id)
                        }
                        className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: `${COLORS.error}10` }}
                        aria-label="Delete"
                      >
                        <TrashIcon
                          className="h-3.5 w-3.5"
                          style={{ color: COLORS.error }}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !submitting && setShowModal(false)}
          />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-5 space-y-4 transform transition-all duration-300 animate-fade-in-up"
            style={{ boxShadow: `0 10px 25px ${COLORS.primary}20` }}
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:rotate-90"
              onClick={() => !submitting && setShowModal(false)}
            >
              <XMarkIcon
                className="h-4 w-4"
                style={{ color: COLORS.textMuted }}
              />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${COLORS.primary}15` }}
              >
                {editing ? (
                  <PencilIcon
                    className="h-5 w-5"
                    style={{ color: COLORS.primary }}
                  />
                ) : (
                  <PlusIcon
                    className="h-5 w-5"
                    style={{ color: COLORS.primary }}
                  />
                )}
              </div>
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.primary }}
              >
                {editing ? "Edit Subcategory" : "Add Subcategory"}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: COLORS.textMuted }}
                  >
                    Main Category
                  </label>
                  <select
                    value={formMainCategory}
                    onChange={(e) =>
                      setFormMainCategory(e.target.value as "Men" | "Women")
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm transition-all duration-300 focus:ring"
                    style={{
                      backgroundColor: COLORS.inputBg,
                      borderColor: COLORS.inputBorder,
                      color: COLORS.text,
                      border: `1px solid ${COLORS.inputBorder}`,
                      outline: "none",
                    }}
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.textMuted }}
                >
                  Subcategory Name
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm transition-all duration-300 focus:ring"
                  style={{
                    backgroundColor: COLORS.inputBg,
                    borderColor: COLORS.inputBorder,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.inputBorder}`,
                    outline: "none",
                  }}
                  placeholder="e.g. Shirts, Pants, etc."
                  autoFocus
                />
              </div>

              {/* Image (optional) */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.textMuted }}
                >
                  Subcategory Image (optional)
                </label>
                <div className="flex items-center gap-3">
                  {formImagePreview || formExistingImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formImagePreview || formExistingImageUrl}
                      alt="preview"
                      className="h-12 w-12 rounded object-cover border"
                      style={{ borderColor: `${COLORS.surfaceLight}80` }}
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded flex items-center justify-center border"
                      style={{
                        borderColor: `${COLORS.surfaceLight}80`,
                        backgroundColor: `${COLORS.surfaceLight}30`,
                      }}
                    >
                      <FolderIcon
                        className="h-5 w-5"
                        style={{ color: COLORS.textMuted }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label
                      className="px-3 py-2 text-xs rounded-lg border cursor-pointer transition-colors hover:bg-gray-50"
                      style={{
                        borderColor: COLORS.inputBorder,
                        color: COLORS.text,
                      }}
                    >
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormImageFile(file);
                          if (file) {
                            setFormImagePreview(URL.createObjectURL(file));
                          } else {
                            setFormImagePreview("");
                          }
                        }}
                      />
                    </label>
                    {(formImagePreview || formExistingImageUrl) && (
                      <button
                        type="button"
                        className="px-3 py-2 text-xs rounded-lg border transition-colors hover:bg-gray-50"
                        style={{
                          borderColor: COLORS.inputBorder,
                          color: COLORS.textMuted,
                        }}
                        onClick={() => {
                          // Clear selected and existing image (will remove on save)
                          setFormImageFile(null);
                          setFormImagePreview("");
                          setFormExistingImageUrl("");
                          setFormImageCleared(true);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="text-xs rounded-lg p-2 flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${COLORS.error}10`,
                    color: COLORS.error,
                  }}
                >
                  <ExclamationCircleIcon className="h-3 w-3 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border transition-all duration-300 hover:bg-gray-50"
                  style={{
                    borderColor: COLORS.inputBorder,
                    color: COLORS.textMuted,
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded-lg text-white shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-70"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
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
};

export default CategoriesPage;
