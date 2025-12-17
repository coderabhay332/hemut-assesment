"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionForm } from "./QuestionForm";
import { QuestionCard } from "./QuestionCard";

export type Answer = {
  id: number;
  user_name: string;
  message: string;
  created_at: string;
};

export type Question = {
  id: number;
  message: string;
  status: "pending" | "escalated" | "answered" | string;
  created_at: string;
  was_escalated?: boolean;
  answers: Answer[];
};

type WsEvent =
  | { type: "NEW_QUESTION"; payload: Question }
  | { type: "QUESTION_UPDATED"; payload: Question }
  | {
      type: "NEW_ANSWER";
      payload: {
        question_id: number;
      } & Answer;
    };

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/questions";

export default function ForumPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [userName, setUserName] = useState("");

  const [qMessage, setQMessage] = useState("");
  const [qError, setQError] = useState<string | null>(null);
  const [qSubmitting, setQSubmitting] = useState(false);

  const [answerText, setAnswerText] = useState<Record<number, string>>({});
  const [answerSubmitting, setAnswerSubmitting] = useState<Record<number, boolean>>(
    {}
  );

  const wsRef = useRef<WebSocket | null>(null);

  const orderedQuestions = useMemo(() => {
    const orderWeight = (q: Question) => {
      if (q.status === "escalated") return 0;
      if (q.status === "answered") return 2;
      return 1;
    };

    return [...questions].sort((a, b) => {
      const wa = orderWeight(a);
      const wb = orderWeight(b);
      if (wa !== wb) return wa - wb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [questions]);

  const totalPages = Math.max(1, Math.ceil(orderedQuestions.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return orderedQuestions.slice(start, end);
  }, [orderedQuestions, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/questions`);
        if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);
        const data: Question[] = await res.json();
        if (!cancelled) {
          setQuestions(data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("hemut_is_admin") === "1");
      const savedName = localStorage.getItem("hemut_user_name") || "";
      setUserName(savedName);
    }
  }, []);

  const handleUserNameChange = (value: string) => {
    setUserName(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("hemut_user_name", value);
    }
  };

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    setWsError(null);

    ws.onopen = () => {
      setWsConnected(true);
      setWsError(null);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsError("WebSocket connection error");
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WsEvent = JSON.parse(event.data);
        if (parsed.type === "NEW_QUESTION") {
          if (isAdmin) {
            setAdminNotification(
              `New question #${parsed.payload.id}: ${parsed.payload.message}`
            );
          }
          setQuestions((prev) => [parsed.payload, ...prev]);
        } else if (parsed.type === "QUESTION_UPDATED") {
          setQuestions((prev) =>
            prev.map((q) => (q.id === parsed.payload.id ? parsed.payload : q))
          );
        } else if (parsed.type === "NEW_ANSWER") {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === parsed.payload.question_id
                ? {
                    ...q,
                    answers: [...(q.answers ?? []), parsed.payload],
                  }
                : q
            )
          );
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [isAdmin]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send("ping");
        } catch {
        }
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);

    if (!qMessage.trim()) {
      setQError("Question cannot be blank.");
      return;
    }
    if (!userName.trim()) {
      setQError("Name is required.");
      return;
    }

    setQSubmitting(true);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/questions`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        setQSubmitting(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setQMessage("");
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            setQError(errRes.detail || "Failed to submit question.");
          } catch {
            setQError("Failed to submit question.");
          }
        }
      }
    };
    xhr.send(
      JSON.stringify({
        user_name: userName.trim(),
        message: qMessage.trim(),
      })
    );
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const text = (answerText[questionId] || "").trim();
    if (!userName.trim() || !text) {
      alert("Name and answer cannot be blank.");
      return;
    }

    setAnswerSubmitting((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch(`${API_BASE}/questions/${questionId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName.trim(),
          message: text,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to submit answer");
    } finally {
      setAnswerSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <QuestionForm
        qName={userName}
        qMessage={qMessage}
        qError={qError}
        qSubmitting={qSubmitting}
        wsConnected={wsConnected}
        wsError={wsError}
        isAdmin={isAdmin}
        adminNotification={adminNotification}
        onNameChange={handleUserNameChange}
        onMessageChange={setQMessage}
        onSubmit={handleSubmitQuestion}
        onDismissNotification={() => setAdminNotification(null)}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Questions</h2>
          <span className="text-[11px] text-neutral-500">
            {questions.length} total &middot; page {page} of {totalPages}
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mb-1 text-[11px] text-neutral-400">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-0.5 rounded border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-neutral-500"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-0.5 rounded border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-neutral-500"
            >
              Next
            </button>
          </div>
        )}
        <div className="space-y-2">
          {loading && (
            <div className="text-[12px] text-neutral-400">
              Loading questions...
            </div>
          )}
          {!loading && orderedQuestions.length === 0 && (
            <div className="text-[12px] text-neutral-400">
              No questions yet. Be the first to ask something.
            </div>
          )}
          {paginatedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isAdmin={isAdmin}
              answerName={userName}
              answerText={answerText[q.id] || ""}
              answerSubmitting={!!answerSubmitting[q.id]}
              onChangeAnswerName={handleUserNameChange}
              onChangeAnswerText={(value) =>
                setAnswerText((prev) => ({ ...prev, [q.id]: value }))
              }
              onSubmitAnswer={() => handleSubmitAnswer(q.id)}
              onMarkAnswered={async () => {
                try {
                  const token = typeof window !== "undefined" ? localStorage.getItem("hemut_admin_token") : null;
                  if (!token) {
                    alert("Not authenticated. Please log in again.");
                    return;
                  }
                  const res = await fetch(
                    `${API_BASE}/questions/${q.id}/answer`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                      },
                    }
                  );
                  if (!res.ok) {
                    if (res.status === 401) {
                      alert("Authentication failed. Please log in again.");
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("hemut_admin_token");
                        localStorage.removeItem("hemut_is_admin");
                      }
                    } else {
                      throw new Error("Failed to mark answered");
                    }
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to mark as answered");
                }
              }}
              onEscalate={async () => {
                try {
                  const token = typeof window !== "undefined" ? localStorage.getItem("hemut_admin_token") : null;
                  if (!token) {
                    alert("Not authenticated. Please log in again.");
                    return;
                  }
                  const res = await fetch(
                    `${API_BASE}/questions/${q.id}/escalate`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                      },
                    }
                  );
                  if (!res.ok) {
                    if (res.status === 401) {
                      alert("Authentication failed. Please log in again.");
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("hemut_admin_token");
                        localStorage.removeItem("hemut_is_admin");
                      }
                    } else {
                      throw new Error("Failed to escalate");
                    }
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to escalate");
                }
              }}
              formatTime={formatTime}
            />
          ))}
        </div>
      </section>
    </div>
  );
}


