"use client";

import { FormEvent, useEffect, useState } from "react";

import { apiRequest } from "../../lib/api";

const options = {
  connection_goal: [["situationship", "Situationship"], ["casual_dating", "Casual dating"], ["companionship", "Companionship"], ["friendship_romantic", "Friendship with romantic potential"], ["open_to_relationship", "Open to relationship"]],
  connection_style: [["emotional", "Emotional"], ["romantic", "Romantic"], ["physical", "Physical"], ["social", "Social/companionship"], ["combination", "Combination"]],
  exclusivity: [["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]],
  meeting_frequency: [["weekly", "Once a week"], ["monthly", "2-3 times a month"], ["occasionally", "Occasionally"], ["flexible", "Flexible"]],
} as const;

function Field({ name, label }: { name: keyof typeof options; label: string }) {
  return <label className="block space-y-1"><span className="text-sm font-medium">{label}</span><select className="w-full rounded border p-3" name={name} defaultValue="" required><option disabled value="">Choose one</option>{options[name].map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}

export default function PreferencesPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Record<string, string> | null>(null);
  useEffect(() => { const token = sessionStorage.getItem("access_token"); if (!token) return; apiRequest<Record<string, string>>("/preferences/me/", { headers: { Authorization: `Bearer ${token}` } }).then(setExisting).catch(() => undefined); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) return setError("Please log in first.");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/preferences/me/", { method: existing ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(Object.fromEntries(form)) });
      setMessage(existing ? "Your preferences have been updated." : "Preferences saved. You’re ready to discover people.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save preferences."); }
  }
  return <main className="app-page max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Your expectations</p><h1 className="mt-2 text-4xl font-bold text-rose-950">What are you looking for?</h1><p className="mt-3 text-stone-600">These answers help make discovery more intentional. You can update them anytime.</p><section className="form-card mt-8"><form className="space-y-5" onSubmit={submit}><Field name="connection_goal" label="Connection goal" /><Field name="connection_style" label="Connection style" /><Field name="exclusivity" label="Looking for exclusivity?" /><Field name="meeting_frequency" label="Meeting frequency" />{error && <p className="notice-error">{error}</p>}{message && <p className="notice-success">{message}</p>}<button className="btn-primary w-full" type="submit">{existing ? "Save changes" : "Save preferences"}</button></form></section></main>;
}
