"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setMessage(error.message);
      else setMessage("Check your email for the magic link.");
    } catch (err: any) {
      setMessage(err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

        <p className="mt-4 text-sm text-gray-500">
          After you confirm the link you will be able to open the dashboard at
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="ml-1 text-blue-600 underline"
          >
            /dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
