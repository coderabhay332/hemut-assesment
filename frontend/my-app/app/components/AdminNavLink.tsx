"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("hemut_is_admin") === "1");
    }
  }, []);

  if (!isAdmin) {
    return (
      <Link href="/login" className="hover:text-white">
        Admin Login
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("hemut_is_admin");
          localStorage.removeItem("hemut_admin_token");
        }
        router.push("/");
      }}
      className="hover:text-white text-left"
    >
      Logout (admin)
    </button>
  );
}


