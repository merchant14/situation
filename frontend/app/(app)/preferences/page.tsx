"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "../../../lib/api";
import { PageHeader } from "../../components/page-header";

type Preferences = { connection_goal: string; connection_style: string; exclusivity: string; meeting_frequency: string };
const options = {
  connection_goal: [["situationship", "Situationship"], ["casual_dating", "Casual dating"], ["companionship", "Companionship"], ["friendship_romantic", "Friendship with romantic potential"], ["open_to_relationship", "Open to relationship"]],
  connection_style: [["emotional", "Emotional"], ["romantic", "Romantic"], ["physical", "Physical"], ["social", "Social / companionship"], ["combination", "Combination"]],
  exclusivity: [["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]],
  meeting_frequency: [["weekly", "Once a week"], ["monthly", "2–3 times a month"], ["occasionally", "Occasionally"], ["flexible", "Flexible"]],
} as const;

function Field({ name, label, value }: { name: keyof typeof options; label: string; value?: string }) {
  return <label className="block space-y-2"><span className="label">{label}</span><select className="field" name={name} defaultValue={value ?? ""} required><option disabled value="">Choose one</option>{options[name].map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>;
}

export default function PreferencesPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [existing, setExisting] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    apiRequest<Preferences>("/preferences/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then(setExisting)
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiError && requestError.status === 404) return;
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/preferences/me/", { method: existing ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(Object.fromEntries(form)) });
      setMessage(existing ? "Your preferences have been updated." : "Preferences saved.");
      window.setTimeout(() => router.push("/discover"), 700);
    } catch {
      setError("We couldn’t save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="max-w-2xl">
    <PageHeader title="Settings" subtitle="These answers help make discovery more intentional. You can update them anytime." />
    {loading ? <div aria-label="Loading preferences" className="form-card mt-8 animate-pulse space-y-5"><div className="h-12 rounded bg-stone-100"/><div className="h-12 rounded bg-stone-100"/><div className="h-12 rounded bg-stone-100"/><div className="h-12 rounded bg-stone-100"/></div> : loadError ? <div role="alert" className="form-card"><p className="text-stone-700">We couldn’t load your preferences.</p><button type="button" onClick={() => window.location.reload()} className="mt-4 font-semibold text-rose-700 underline">Try again</button></div> :
      <section className="form-card"><form className="space-y-5" onSubmit={submit}>
        <Field name="connection_goal" label="Connection goal" value={existing?.connection_goal} />
        <Field name="connection_style" label="Connection style" value={existing?.connection_style} />
        <Field name="exclusivity" label="Looking for exclusivity?" value={existing?.exclusivity} />
        <Field name="meeting_frequency" label="Meeting frequency" value={existing?.meeting_frequency} />
        {error && <p role="alert" className="notice-error">{error}</p>}{message && <p role="status" className="notice-success">{message}</p>}
        <button className="btn-primary w-full" type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Save preferences"}</button>
      </form></section>}
  </main>;
}
