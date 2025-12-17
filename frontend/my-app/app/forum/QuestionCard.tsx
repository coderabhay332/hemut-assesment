import React from "react";
import type { Question, Answer } from "./page";

type QuestionCardProps = {
  question: Question;
  isAdmin: boolean;
  answerName: string;
  answerText: string;
  answerSubmitting: boolean;
  onChangeAnswerName: (value: string) => void;
  onChangeAnswerText: (value: string) => void;
  onSubmitAnswer: () => void;
  onMarkAnswered: () => Promise<void>;
  onEscalate: () => Promise<void>;
  formatTime: (iso: string) => string;
};

export function QuestionCard(props: QuestionCardProps) {
  const {
    question: q,
    isAdmin,
    answerName,
    answerText,
    answerSubmitting,
    onChangeAnswerName,
    onChangeAnswerText,
    onSubmitAnswer,
    onMarkAnswered,
    onEscalate,
    formatTime,
  } = props;

  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs space-y-2">
      <div className="flex justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300">
              #{q.id}
            </span>
            {q.status === "answered" && q.was_escalated && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/40">
                ESCALATED
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                q.status === "answered"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : q.status === "escalated"
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                  : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/40"
              }`}
            >
              {q.status.toUpperCase()}
            </span>
          </div>
          <p className="text-[13px] text-neutral-50">{q.message}</p>
        </div>
        <div className="text-right text-[11px] text-neutral-400 space-y-1">
          <div>{formatTime(q.created_at)}</div>
          {isAdmin && q.status !== "answered" && (
            <button
              type="button"
              onClick={onMarkAnswered}
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
            >
              Mark answered
            </button>
          )}
          {isAdmin && q.status === "pending" && (
            <button
              type="button"
              onClick={onEscalate}
              className="inline-flex items-center justify-center rounded-full border border-amber-400/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/10 ml-1"
            >
              Escalate
            </button>
          )}
        </div>
      </div>

      {q.answers && q.answers.length > 0 && (
        <div className="mt-1 space-y-1 border-t border-neutral-800 pt-2">
          {q.answers.map((a: Answer) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="text-[11px] text-neutral-200">
                <span className="font-semibold text-cyan-300">
                  {a.user_name}
                </span>{" "}
                <span className="text-neutral-400">answered:</span> {a.message}
              </div>
              <div className="text-[10px] text-neutral-500">
                {formatTime(a.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2 border-t border-neutral-900 pt-2">
        {q.status === "answered" ? (
          <div className="text-[10px] text-neutral-500">
            This question has been marked as{" "}
            <span className="font-semibold text-emerald-300">answered</span>;
            new answers are disabled.
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your name"
                value={answerName}
                onChange={(e) => onChangeAnswerName(e.target.value)}
                className="w-32 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Write an answer..."
                value={answerText}
                onChange={(e) => onChangeAnswerText(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={onSubmitAnswer}
                disabled={answerSubmitting}
                className="px-3 py-1 rounded-lg bg-neutral-100 text-neutral-900 text-[11px] font-semibold hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {answerSubmitting ? "Sending..." : "Answer"}
              </button>
            </div>
            <div className="text-[10px] text-neutral-500">
              Guests can answer without logging in. Admins use the{" "}
              <span className="font-medium text-neutral-300">Admin Login</span>{" "}
              page to mark questions as answered.
            </div>
          </>
        )}
      </div>
    </article>
  );
}


