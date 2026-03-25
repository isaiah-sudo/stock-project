import { LinkBrokerageCard } from "../../components/LinkBrokerageCard";

export default function LinkPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Account Linking</h1>
        <a href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
          Back to Dashboard
        </a>
      </div>
      <LinkBrokerageCard />
    </main>
  );
}
