"use client";

import { useState } from "react";

export default function ReorderPage() {
  const [date, setDate] = useState("");
  const [fromOperatorId, setFromOperatorId] = useState("");
  const [toOperatorId, setToOperatorId] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date || !fromOperatorId || !toOperatorId) {
      setMessage("সব ফিল্ড পূরণ করুন।");
      return;
    }

    try {
      const res = await fetch("/api/daily-production/reposition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          fromOperatorId,
          toOperatorId,
        }),
      });

      const data = await res.json();
      setMessage(data.success ? "Reposition সফল হয়েছে ✅" : data.message);
    } catch (err) {
      console.error(err);
      setMessage("Error occurred");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Operator Reorder</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">From Operator ID</label>
          <input
            type="text"
            value={fromOperatorId}
            onChange={(e) => setFromOperatorId(e.target.value)}
            placeholder="যাকে move করতে হবে"
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">To Operator ID</label>
          <input
            type="text"
            value={toOperatorId}
            onChange={(e) => setToOperatorId(e.target.value)}
            placeholder="যার নিচে বসানো হবে"
            className="border rounded p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Reorder
        </button>
      </form>

      {message && <p className="mt-4 text-green-600 font-semibold">{message}</p>}
    </div>
  );
}
