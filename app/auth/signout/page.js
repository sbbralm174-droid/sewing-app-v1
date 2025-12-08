"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}

      className="px-3 py-2 bg-red-600 text-white rounded"
    >
      Logout
    </button>
  );
}
