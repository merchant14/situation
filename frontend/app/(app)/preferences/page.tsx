"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "../../../lib/api";
import { PageHeader } from "../../components/page-header";

const options = {
  connection_goal: [["situationship", "Situationship"], ["casual_dating", "Casual dating"], ["companionship", "Companionship"], ["friendship_romantic", "Friendship with romantic potential"], ["open_to_relationship", "Open to relationship"]],
  connection_style: [["emotional", "Emotional"], ["romantic", "Romantic"], ["physical", "Physical"], ["social", "Social/companionship"], ["combination", "Combination"]],
  exclusivity: [["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]],
  meeting_frequency: [["weekly", "Once a week"], ["monthly", "2-3 times a month"], ["occasionally", "Occasionally"], ["flexible", "Flexible"]],
} as const;

function Field({ name, label, value }: { name: keyof typeof options; label: string; value?: string }) {
  return <label className="block space-y-2"><span className="label">{label}</span><select className="field" name={name} defaultValue={value ?? ""} required><option disabled value="">Choose one</option>{options[name].map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}

export default function PreferencesPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Record<string, string> | null>(null);
  const router = useRouter();
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
      window.setTimeout(() => router.push("/discover"), 700);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save preferences."); }
  }
  return <main className="max-w-2xl"><PageHeader title="Settings" subtitle="These answers help make discovery more intentional. You can update them anytime." /><section className="form-card"><form className="space-y-5" onSubmit={submit}><Field name="connection_goal" label="Connection goal" value={existing?.connection_goal} /><Field name="connection_style" label="Connection style" value={existing?.connection_style} /><Field name="exclusivity" label="Looking for exclusivity?" value={existing?.exclusivity} /><Field name="meeting_frequency" label="Meeting frequency" value={existing?.meeting_frequency} />{error && <p className="notice-error">{error}</p>}{message && <p className="notice-success">{message}</p>}<button className="btn-primary w-full" type="submit">{existing ? "Save changes" : "Save preferences"}</button></form></section></main>;
}
