"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginAdmin() {
  const router = useRouter();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Server-side authentication - credentials never exposed to client
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        // Store only session data (no password)
        Cookies.set("adminAuth", JSON.stringify(data.admin), {
          expires: 3,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict"
        });
        router.push("/admin");
      } else {
        setError(data.message || "Login yoki parol noto'g'ri!");
      }
    } catch (err) {
      setError("Server bilan bog'lanishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Админ Логин</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700">Логин</label>
            <input
              type="text"
              name="login"
              value={form.login}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Парол</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white p-2 rounded-md hover:bg-primary hover:opacity-75"
            disabled={loading}
          >
            {loading ? "Кириш..." : "Кириш"}
          </button>
        </form>
      </div>
    </div>
  );
}
