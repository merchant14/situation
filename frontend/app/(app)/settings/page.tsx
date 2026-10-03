"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../lib/api";
import { clearSession } from "../../../lib/session";

type SettingsSummary = {
  account: { display_name: string | null; email: string };
  features: {
    password_change: boolean;
    safety_tools: boolean;
    notification_settings: boolean;
    privacy_settings: boolean;
    delete_account: boolean;
  };
};

const cardClass = "min-w-0 rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.035)] sm:p-7";
const labelClass = "block text-[11px] font-medium uppercase tracking-[0.08em] text-[#806d67]";
const inputClass = "mt-1.5 min-h-12 w-full min-w-0 rounded-xl border border-[#e6ddda] bg-white px-4 py-3 text-[15px] text-[#2f211c] placeholder:text-[#a29189] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#a9513d]";
const linkClass = "text-sm font-medium text-[#963f2e] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]";
const buttonClass = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] disabled:cursor-not-allowed disabled:opacity-60";

function EditRow({ title, description, href }: { title: string; description: string; href: string }) {
  return <Link href={href} className="group flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[#f0eae7] px-4 py-4 hover:border-[#d9c7c0] hover:bg-[#fdfaf8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">
    <span className="min-w-0"><span className="block text-sm font-semibold text-[#342723]">{title}</span><span className="mt-1 block text-sm leading-5 text-[#806d67]">{description}</span></span>
    <span aria-hidden="true" className="shrink-0 text-lg text-[#a9513d] group-hover:translate-x-0.5">›</span>
  </Link>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SettingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadSettings = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    setLoadError("");
    try {
      setSummary(await apiRequest<SettingsSummary>("/settings/", { headers: { Authorization: `Bearer ${token}` } }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setLoadError(error instanceof ApiError ? error.message : "We couldn’t load your settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordBusy) return;
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords don’t match.");
      return;
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setPasswordBusy(true);
    try {
      await apiRequest<void>("/auth/change-password/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      // The backend revokes both access and refresh tokens when the password changes.
      window.setTimeout(() => {
        clearSession();
        router.replace("/login");
      }, 1800);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setPasswordError(error instanceof ApiError ? error.message : "We couldn’t change your password. Please try again.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteBusy || !deleteConfirmed) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await apiRequest("/auth/me/", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: deletePassword }),
      });
      clearSession();
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setDeleteError(error instanceof ApiError ? error.message : "We couldn’t delete your account. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return <section className="mx-auto w-full max-w-[900px] min-w-0">
    <header className="mb-7">
      <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]">Your space</p>
      <h1 className="font-serif text-[38px] leading-tight tracking-[-0.035em] text-[#15100e] sm:text-[46px]">Settings</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-[#6e5c56]">Manage your account and the details you share.</p>
    </header>

    {loading ? <div role="status" aria-label="Loading settings" aria-busy="true" className="space-y-5">
      {[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-[#eee7e5] bg-white" />)}
    </div> : loadError ? <div role="alert" className={cardClass}>
      <p className="text-sm leading-6 text-[#6e5c56]">{loadError}</p>
      <button type="button" onClick={() => void loadSettings()} className={`${buttonClass} mt-5`}>Try again</button>
    </div> : summary && <div className="space-y-5">
      <section className={cardClass} aria-labelledby="account-heading">
        <h2 id="account-heading" className="font-serif text-xl text-[#241713]">Account</h2>
        <dl className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0"><dt className={labelClass}>Display name</dt><dd className="mt-1 break-words text-sm font-medium text-[#342723]">{summary.account.display_name || "Not set"}</dd></div>
          <div className="min-w-0"><dt className={labelClass}>Email</dt><dd className="mt-1 break-all text-sm font-medium text-[#342723]">{summary.account.email}</dd></div>
        </dl>
        {summary.features.password_change && <div className="mt-6 border-t border-[#f0eae7] pt-5">
          <h3 className="text-sm font-semibold text-[#342723]">Change password</h3>
          <form className="mt-4 space-y-4" onSubmit={changePassword}>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="min-w-0"><span className={labelClass}>Current password</span><input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
              <span className="hidden sm:block" aria-hidden="true" />
              <label className="min-w-0"><span className={labelClass}>New password</span><input className={inputClass} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
              <label className="min-w-0"><span className={labelClass}>Confirm new password</span><input className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            </div>
            <div aria-live="polite" className="min-h-5">
              {passwordError && <p role="alert" className="text-sm text-[#873e30]">{passwordError}</p>}
              {passwordSuccess && <p role="status" className="text-sm text-[#456149]">Password changed. You’ll be signed out shortly; sign in again with your new password.</p>}
            </div>
            <button type="submit" disabled={passwordBusy} className={buttonClass}>{passwordBusy ? "Changing password…" : "Update password"}</button>
          </form>
        </div>}
      </section>

      <section className={cardClass} aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="font-serif text-xl text-[#241713]">Profile</h2>
        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
          <EditRow title="Edit Profile" description="Update your photo and personal details." href="/profile/edit" />
          <EditRow title="Preferences" description="Update what you’re looking for." href="/profile/preferences" />
          <EditRow title="Interests" description="Choose interests that represent you." href="/profile/interests" />
          <EditRow title="Preview Profile" description="See how your profile appears to others." href="/profile/preview" />
        </div>
      </section>

      {summary.features.safety_tools && <section className={cardClass} aria-labelledby="safety-heading">
        <h2 id="safety-heading" className="font-serif text-xl text-[#241713]">Safety</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e5c56]">Block or report a profile from Discover. These controls are available on each profile; there isn’t a separate blocked-users list.</p>
        <Link href="/discover" className={`${linkClass} mt-4 inline-block`}>Go to Discover</Link>
      </section>}

      <section className={cardClass} aria-labelledby="account-actions-heading">
        <h2 id="account-actions-heading" className="font-serif text-xl text-[#241713]">Account Actions</h2>
        <div className="mt-5 flex flex-col gap-3 border-b border-[#f0eae7] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-semibold text-[#342723]">Log out</h3><p className="mt-1 text-sm leading-5 text-[#806d67]">Sign out of this device.</p></div>
          <button type="button" onClick={logout} className="min-h-12 rounded-xl border border-[#d9c7c0] px-5 text-sm font-semibold text-[#713d31] hover:bg-[#fdf5f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Log out</button>
        </div>
        {summary.features.delete_account && <div className="pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><h3 className="text-sm font-semibold text-[#713d31]">Delete account</h3><p className="mt-1 max-w-xl text-sm leading-5 text-[#806d67]">Permanently remove your account and its associated data. This cannot be undone.</p></div>
            <button type="button" onClick={() => { setDeleteOpen((open) => !open); setDeleteError(""); }} aria-expanded={deleteOpen} className="min-h-12 shrink-0 rounded-xl border border-[#c98473] px-5 text-sm font-semibold text-[#873e30] hover:bg-[#fff7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">{deleteOpen ? "Cancel" : "Delete account"}</button>
          </div>
          {deleteOpen && <form onSubmit={deleteAccount} className="mt-5 rounded-xl border border-[#f0d8d1] bg-[#fffaf8] p-4 sm:p-5">
            <p className="text-sm leading-6 text-[#713d31]">To confirm permanent deletion, enter your current password and confirm that you understand this action is irreversible.</p>
            <label className="mt-4 block max-w-md"><span className={labelClass}>Current password</span><input className={inputClass} type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required /></label>
            <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-5 text-[#594741]"><input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]" /><span>I understand my account and associated data will be permanently deleted.</span></label>
            {deleteError && <p role="alert" className="mt-3 text-sm text-[#873e30]">{deleteError}</p>}
            <button type="submit" disabled={deleteBusy || !deleteConfirmed} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#873e30] px-5 text-sm font-semibold text-white hover:bg-[#702c22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30] disabled:cursor-not-allowed disabled:opacity-60">{deleteBusy ? "Deleting account…" : "Permanently delete account"}</button>
          </form>}
        </div>}
      </section>
    </div>}
  </section>;
}
