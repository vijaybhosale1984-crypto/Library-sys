import clsx from "clsx";
import { Loader2, X, AlertCircle } from "lucide-react";
import React from "react";

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({
  variant = "primary", size = "md", loading, children, className, disabled, ...rest
}: ButtonProps) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
  const variants = {
    primary:   "bg-[#1a1208] text-[#fdf8f0] hover:bg-[#2d2010] focus:ring-[#1a1208]",
    secondary: "bg-[#f0e6d0] text-[#1a1208] hover:bg-[#e8d8b8] focus:ring-[#c8b89a]",
    danger:    "bg-[#b94040] text-white hover:bg-[#9a3434] focus:ring-[#b94040]",
    ghost:     "bg-transparent text-[#1a1208]/70 hover:bg-[#f0e6d0] focus:ring-[#c8b89a]",
  };
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 spin" />}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...rest }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#1a1208]/60 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "px-3 py-2 text-sm rounded-lg border bg-white/70 text-[#1a1208] placeholder:text-[#1a1208]/30",
          "focus:outline-none focus:ring-2 focus:ring-[#c8860a]/40 focus:border-[#c8860a]",
          error ? "border-[#b94040]" : "border-[#e8d8b8]",
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-[#b94040]">{error}</span>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, children, className, id, ...rest }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#1a1208]/60 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          "px-3 py-2 text-sm rounded-lg border bg-white/70 text-[#1a1208]",
          "focus:outline-none focus:ring-2 focus:ring-[#c8860a]/40 focus:border-[#c8860a]",
          error ? "border-[#b94040]" : "border-[#e8d8b8]",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-[#b94040]">{error}</span>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...rest }: TextareaProps) {
  const taId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-xs font-semibold text-[#1a1208]/60 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        rows={3}
        className={clsx(
          "px-3 py-2 text-sm rounded-lg border bg-white/70 text-[#1a1208] placeholder:text-[#1a1208]/30 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-[#c8860a]/40 focus:border-[#c8860a] border-[#e8d8b8]",
          className
        )}
        {...rest}
      />
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1a1208]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#fdf8f0] rounded-2xl shadow-2xl w-full max-w-lg fade-in border border-[#e8d8b8]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d8b8]">
          <h2 className="font-display text-xl font-semibold text-[#1a1208]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f0e6d0] text-[#1a1208]/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    green:  "bg-[#4a7c59]/15 text-[#2d5940]",
    yellow: "bg-[#f0b429]/20 text-[#8a5c00]",
    red:    "bg-[#b94040]/15 text-[#b94040]",
    gray:   "bg-[#1a1208]/10 text-[#1a1208]/60",
    blue:   "bg-blue-100 text-blue-800",
  };
  return (
    <span className={clsx("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", colors[color] || colors.gray)}>
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("spin text-[#c8860a]", className || "w-6 h-6")} />;
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-[#1a1208]/40">
      <AlertCircle className="w-8 h-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────

export function PageHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1a1208]">{title}</h1>
        {subtitle && <p className="text-sm text-[#1a1208]/50 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

export function StatCard({
  label, value, icon: Icon, color = "amber",
}: { label: string; value: string | number; icon: React.ElementType; color?: string }) {
  const colors: Record<string, string> = {
    amber: "text-[#c8860a] bg-[#f0b429]/15",
    sage:  "text-[#4a7c59] bg-[#4a7c59]/15",
    rust:  "text-[#b94040] bg-[#b94040]/15",
    ink:   "text-[#1a1208] bg-[#1a1208]/10",
  };
  return (
    <div className="bg-white rounded-2xl border border-[#e8d8b8] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#1a1208]/50">{label}</span>
        <span className={clsx("p-2 rounded-xl", colors[color])}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="font-display text-3xl font-bold text-[#1a1208]">{value}</div>
    </div>
  );
}
