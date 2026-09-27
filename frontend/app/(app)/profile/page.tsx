"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { PageHeader } from "../../components/page-header";

type Profile = {
  display_name: string;
  gender: string;
  city: string;
  bio?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
};

type Preferences = {
  connection_goal: string;
  connection_style: string;
  exclusivity: string;
  meeting_frequency: string;
};

const preferencesLabels: Record<string, Record<string, string>> = {
  connection_goal: {
    situationship: "Situationship",
    casual_dating: "Casual dating",
    companionship: "Companionship",
    friendship_romantic: "Friendship with romantic potential",
    open_to_relationship: "Open to relationship",
  },
  connection_style: {
    emotional: "Emotional",
    romantic: "Romantic",
    physical: "Physical",
    social: "Social/companionship",
    combination: "Combination",
  },
  exclusivity: {
    yes: "Yes, exclusive",
    no: "No, open",
    not_sure: "Not sure",
  },
  meeting_frequency: {
    weekly: "1x per week",
    monthly: "2-3x per month",
    occasionally: "Occasionally",
    flexible: "Flexible",
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      apiRequest<Profile>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      apiRequest<Preferences>("/preferences/me/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
    ])
      .then(([p, prefs]) => {
        setProfile(p);
        setPreferences(prefs);
      })
      .catch(() => setError("Unable to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user_id");
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-stone-200 rounded" />
          <div className="h-64 bg-stone-200 rounded" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-2xl">
        <PageHeader title="Profile" subtitle="Set up how you appear to other people." />
        <p className="text-stone-600">
          You haven't created a profile yet.{" "}
          <Link href="/profile/setup" className="text-rose-600 underline font-semibold">
            Create one now
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl">
      <PageHeader
        title="Profile"
        subtitle="This is how you appear to people you discover."
        actions={
          <Link href="/profile/setup" className="text-sm font-semibold text-rose-700 underline">
            Edit
          </Link>
        }
      />

      {error && <p className="notice-error mt-4">{error}</p>}

      {/* Hero Section */}
      <section className="mt-8 rounded-2xl bg-white border border-stone-200 p-6">
        <div className="flex gap-6">
          <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-stone-100">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-rose-700">
                {profile.display_name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-rose-950">
              {profile.display_name}
            </h2>
            <p className="text-lg text-stone-600">{profile.city}</p>
            {profile.bio && <p className="mt-3 text-stone-700">{profile.bio}</p>}
          </div>
        </div>
      </section>

      {/* Connection Preferences */}
      {preferences && (
        <section className="mt-8">
          <h3 className="text-xl font-bold text-rose-950">Connection Preferences</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Looking for</p>
              <p className="mt-2 text-base font-medium text-rose-950">
                {preferencesLabels.connection_goal[preferences.connection_goal] || preferences.connection_goal}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Connection style</p>
              <p className="mt-2 text-base font-medium text-rose-950">
                {preferencesLabels.connection_style[preferences.connection_style] || preferences.connection_style}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Exclusivity</p>
              <p className="mt-2 text-base font-medium text-rose-950">
                {preferencesLabels.exclusivity[preferences.exclusivity] || preferences.exclusivity}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Meeting frequency</p>
              <p className="mt-2 text-base font-medium text-rose-950">
                {preferencesLabels.meeting_frequency[preferences.meeting_frequency] || preferences.meeting_frequency}
              </p>
            </div>
          </div>
          <Link href="/preferences" className="mt-4 inline-block text-sm text-rose-600 underline font-semibold">
            Edit preferences
          </Link>
        </section>
      )}

      {/* Privacy & Safety */}
      <section className="mt-8">
        <h3 className="text-xl font-bold text-rose-950">Privacy & Safety</h3>
        <div className="mt-4 space-y-3 rounded-xl bg-white border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-950">Block or report users</p>
              <p className="text-sm text-stone-600">Control who can interact with you</p>
            </div>
            <span className="text-xl text-stone-400">→</span>
          </div>
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-950">Delete account</p>
              <p className="text-sm text-stone-600">Permanently remove your account</p>
            </div>
            <span className="text-xl text-stone-400">→</span>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="mt-8 mb-8">
        <h3 className="text-xl font-bold text-rose-950">Account</h3>
        <div className="mt-4 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left font-medium text-rose-600 hover:bg-stone-50 rounded-lg border border-stone-200 transition"
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
