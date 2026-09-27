import { PageHeader } from "../../components/page-header";

export default function NotificationsPage() {
  return (
    <main>
      <PageHeader
        title="Notifications"
        subtitle="Activity from your connections will show up here."
      />
      <div className="rounded-2xl border border-rose-100 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-base font-semibold text-rose-950">You’re all caught up</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-600">
          When someone matches with you or there’s something new to see, it will appear in this list.
        </p>
      </div>
    </main>
  );
}
