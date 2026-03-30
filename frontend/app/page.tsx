import { AuthForm } from "../components/AuthForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 bg-slate-50 py-12">
      <AuthForm />
    </main>
  );
}
