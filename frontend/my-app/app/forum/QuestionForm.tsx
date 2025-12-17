import React from "react";

type QuestionFormProps = {
  qName: string;
  qMessage: string;
  qError: string | null;
  qSubmitting: boolean;
  wsConnected: boolean;
  wsError: string | null;
  isAdmin: boolean;
  adminNotification: string | null;
  onNameChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDismissNotification: () => void;
};

export function QuestionForm(props: QuestionFormProps) {
  const {
    qName,
    qMessage,
    qError,
    qSubmitting,
    wsConnected,
    wsError,
    isAdmin,
    adminNotification,
    onNameChange,
    onMessageChange,
    onSubmit,
    onDismissNotification,
  } = props;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Ask a Question
          </h2>
          <p className="text-[11px] text-neutral-400">
            Guests only need a display name. Questions appear in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`h-2 w-2 rounded-full ${
              wsConnected ? "bg-emerald-400" : "bg-neutral-500"
            }`}
          />
          <span className="text-neutral-400">
            {wsConnected ? "Live updates on" : "Connecting..."}
          </span>
        </div>
      </div>
      {isAdmin && adminNotification && (
        <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200 flex items-center justify-between gap-3">
          <span>{adminNotification}</span>
          <button
            type="button"
            onClick={onDismissNotification}
            className="text-[10px] text-emerald-100/80 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-3 text-sm" noValidate>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={qName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-40 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Type your question..."
            value={qMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={qSubmitting}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-neutral-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {qSubmitting ? "Sending..." : "Send"}
          </button>
        </div>
        {qError && (
          <p className="text-[11px] text-red-400 font-medium">{qError}</p>
        )}
        {wsError && (
          <p className="text-[11px] text-amber-400">
            {wsError} &mdash; questions will still work but won&apos;t live
            update.
          </p>
        )}
      </form>
    </section>
  );
}


