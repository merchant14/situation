"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";

type ProfileInterest = { id: number; name: string; slug: string };
type InterestCatalog = { results: ProfileInterest[]; next: string | null };
type SelectedInterests = { interests: ProfileInterest[] };

export default function ProfileInterestsPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<ProfileInterest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    setLoadError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [catalog, current] = await Promise.all([
        apiRequest<InterestCatalog>("/interests/", { headers }),
        apiRequest<SelectedInterests>("/profile/interests/", { headers }),
      ]);
      // Follow the catalog pagination contract in case the backend adds more entries.
      const entries = [...catalog.results];
      let next = catalog.next;
      while (next) {
        const url = new URL(next, process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1");
        const page = await apiRequest<InterestCatalog>(`/interests/${url.search}`, { headers });
        entries.push(...page.results);
        next = page.next;
      }
      setAvailable(entries);
      setSelectedIds(current.interests.map((interest) => interest.id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setLoadError(error instanceof ApiError ? error.message : "We couldn’t load interests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  function toggle(id: number) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setSaved(false);
    setSaveError("");
  }

  async function save() {
    if (saving) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const result = await apiRequest<SelectedInterests>("/profile/interests/", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interest_ids: selectedIds }),
      });
      setSelectedIds(result.interests.map((interest) => interest.id));
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setSaveError(error instanceof ApiError ? error.message : "We couldn’t save your interests. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="mx-auto max-w-[900px]">
    <header className="mb-8">
      <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#795e54] hover:text-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]"><span aria-hidden="true">←</span> Back to profile</Link>
      <h1 className="mt-5 font-serif text-[36px] leading-tight tracking-[-0.035em] text-[#15100e] sm:text-[44px]">Profile Interests</h1>
      <p className="mt-3 text-base leading-7 text-[#6e5c56]">Choose the interests that represent you.</p>
    </header>

    {loading ? <div className="rounded-2xl border border-[#eee7e5] bg-white p-6 text-sm text-[#6e5c56]" role="status" aria-busy="true">Loading interests…</div>
      : loadError ? <div className="rounded-2xl border border-[#eee7e5] bg-white p-6" role="alert"><p className="text-sm text-[#873e30]">{loadError}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30]">Try again</button></div>
        : <div className="rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.035)] sm:p-7">
          <h2 className="font-serif text-xl text-[#241713]">Available interests</h2>
          {available.length === 0 ? <p className="mt-4 text-sm text-[#6e5c56]">There are no interests available right now.</p> : <div className="mt-5 flex flex-wrap gap-3">
            {available.map((interest) => {
              const checked = selectedIds.includes(interest.id);
              return <button key={interest.id} type="button" aria-pressed={checked} onClick={() => toggle(interest.id)} className={`min-h-12 rounded-xl border px-5 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] ${checked ? "border-[#bd7564] bg-[#fff3ee] font-semibold text-[#713d31]" : "border-[#eee7e5] bg-white text-[#493d38] hover:border-[#d5c4be] hover:bg-[#fdfaf8]"}`}>
                {interest.name}{checked && <span className="sr-only">, selected</span>}
              </button>;
            })}
          </div>}
          <div className="mt-7 border-t border-[#f0eae7] pt-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <div aria-live="polite" className="mb-4 min-h-5 sm:mb-0">
              {saveError && <p role="alert" className="text-sm text-[#873e30]">{saveError}</p>}
              {saved && <p role="status" className="text-sm text-[#456149]">Your interests have been saved.</p>}
            </div>
            <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#a9513d] px-7 text-sm font-semibold text-white shadow-sm hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>}
  </section>;
}
