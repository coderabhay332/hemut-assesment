import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to the Hemut Real-Time Q&amp;A Dashboard
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Guests can post questions and answers in real time. Admins can log in
          to mark questions as answered and keep the queue under control.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/forum"
            className="px-4 py-2 rounded-full bg-cyan-500 text-neutral-950 text-sm font-medium hover:bg-cyan-400 transition-colors"
          >
            Go to Forum
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full border border-neutral-700 text-sm font-medium hover:border-neutral-500"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}