"use client";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code"; // ✅ সঠিক ইম্পোর্ট
import Link from "next/link";

export default function OperatorsPage() {
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      const res = await fetch("/api/operators");
      const data = await res.json();
      setOperators(data);
    };
    fetchOperators();
  }, []);
  console.log(operators[0]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Operators List</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((op) => (
          <div
            key={op._id}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">{op.name}</h2>
                <p className="text-gray-500">{op.operatorId}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <QRCode value={`${op.operatorId} `} size={100} /> {/* ✅ কাজ করবে */}
              </div>
            </div>
            <Link
              href={`/admin/qrcode-operator/${op.operatorId}`}
              className="text-blue-600 mt-2 block text-sm hover:underline"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
