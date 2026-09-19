"use client";

import { FormEvent, useState } from "react";

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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) return setError("Please log in first.");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/preferences/me/", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(Object.fromEntries(form)) });
      setMessage("Preferences saved. Discovery is the next MVP stage.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save preferences."); }
  }
  return <main className="mx-auto max-w-md px-6 py-16"><h1 className="text-3xl font-semibold">What are you looking for?</h1><form className="mt-8 space-y-5" onSubmit={submit}><Field name="connection_goal" label="Connection goal" /><Field name="connection_style" label="Connection style" /><Field name="exclusivity" label="Looking for exclusivity?" /><Field name="meeting_frequency" label="Meeting frequency" />{error && <p className="text-sm text-red-700">{error}</p>}{message && <p className="text-sm text-emerald-700">{message}</p>}<button className="w-full rounded bg-stone-900 p-3 text-white" type="submit">Save preferences</button></form></main>;
}
