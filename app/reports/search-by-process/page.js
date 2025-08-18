"use client";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";

export default function OperatorSearch() {
  const [processes, setProcesses] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOperator, setModalOperator] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Process list load
  useEffect(() => {
    fetch("/api/processes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProcesses(data);
      });
  }, []);

  // Search operators
  const handleSearch = async () => {
    setLoading(true);
    const res = await fetch("/api/operators/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processes: selectedProcesses }),
    });
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  // View operator modal
  const handleViewOperator = async (operator) => {
    setModalOperator(operator);
    setModalOpen(true);
    setModalLoading(true);

    const res = await fetch(`/api/operators/${operator._id}/records`);
    const data = await res.json();
    setModalData(Array.isArray(data) ? data : []);
    setModalLoading(false);
  };

  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div
        className="max-w-5xl mx-auto p-6 font-sans min-h-screen"
        style={{ backgroundColor: "#1A1B22", color: "#E5E9F0", fontFamily: "'Inter', sans-serif" }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: "#E5E9F0" }}>
          🔍 Search Operators by Process
        </h2>

        {/* Searchable Multi-Select */}
        <div className="mb-4">
          <label className="block mb-2 font-medium" style={{ color: "#E5E9F0" }}>
            Search & Select Processes
          </label>
          <input
            type="text"
            placeholder="Type to filter processes..."
            className="w-full p-2 rounded-md mb-2 focus:outline-none focus:ring-2"
            style={{ backgroundColor: "#2D3039", color: "#E5E9F0", borderColor: "#4C566A" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="max-h-40 overflow-y-auto rounded-md p-2"
            style={{ backgroundColor: "#2D3039", borderColor: "#4C566A", borderWidth: "1px" }}
          >
            {filteredProcesses.map((p) => (
              <label key={p._id} className="block mb-1 cursor-pointer" style={{ color: "#E5E9F0" }}>
                <input
                  type="checkbox"
                  className="mr-2"
                  value={p.name}
                  checked={selectedProcesses.includes(p.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProcesses([...selectedProcesses, p.name]);
                    } else {
                      setSelectedProcesses(selectedProcesses.filter((x) => x !== p.name));
                    }
                  }}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="mb-6 px-6 py-2 rounded-lg font-medium transition"
          style={{ backgroundColor: "#5E81AC", color: "#E5E9F0" }}
        >
          Search
        </button>

        {/* Results */}
        <div className="mt-4">
          {loading && <p style={{ color: "#E5E9F0" }}>Searching...</p>}
          {!loading && results.length === 0 && (
            <p style={{ color: "#E5E9F0" }}>No operators found</p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {results.map((op) => (
              <div
                key={op._id}
                className="border p-5 rounded-lg shadow-md hover:shadow-lg transition"
                style={{ backgroundColor: "#2D3039", borderColor: "#4C566A", color: "#E5E9F0" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold" style={{ color: "#E5E9F0" }}>{op.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium`}
                    style={{
                      backgroundColor: op.status === "present" ? "#A3BE8C20" : "#BF616A20",
                      color: op.status === "present" ? "#A3BE8C" : "#BF616A"
                    }}
                  >
                    {op.status || "absent"}
                  </span>
                </div>
                <p style={{ color: "#E5E9F0" }}><strong>ID:</strong> {op.operatorId}</p>
                <p style={{ color: "#E5E9F0" }}><strong>Designation:</strong> {op.designation}</p>
                <p className="mt-2">
                  <strong>Processes:</strong>{" "}
                  <span style={{ color: "#81A1C1" }}>{op.allowedProcesses.join(", ")}</span>
                </p>
                <button
                  onClick={() => handleViewOperator(op)}
                  className="mt-4 px-4 py-2 rounded font-medium transition"
                  style={{ backgroundColor: "#A3BE8C", color: "#1A1B22" }}
                >
                  View Operator
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start pt-20 z-50">
            <div
              className="rounded-lg w-11/12 md:w-3/4 p-6 max-h-[80vh] overflow-y-auto relative shadow-xl"
              style={{ backgroundColor: "#1A1B22", color: "#E5E9F0" }}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 font-bold text-lg"
                style={{ color: "#E5E9F0" }}
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#E5E9F0" }}>
                Operator: {modalOperator?.name}
              </h2>
              {modalLoading && <p style={{ color: "#E5E9F0" }}>Loading records...</p>}
              {!modalLoading && modalData.length === 0 && <p style={{ color: "#E5E9F0" }}>No records found</p>}
              {!modalLoading && modalData.length > 0 && (
                <div className="space-y-4">
                  {modalData.map((rec) => (
                    <div
                      key={rec._id}
                      className="border p-3 rounded shadow-sm"
                      style={{ backgroundColor: "#2D3039", borderColor: "#4C566A", color: "#E5E9F0" }}
                    >
                      <p><strong>Date:</strong> {new Date(rec.date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {rec.status}</p>
                      <p><strong>Process:</strong> {rec.process}</p>
                      <p><strong>Floor:</strong> {rec.floor}</p>
                      <p><strong>Line:</strong> {rec.line}</p>
                      <p><strong>Work As:</strong> {rec.workAs}</p>
                      {rec.hourlyProduction?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Hourly Production:</p>
                          <ul className="list-disc ml-5">
                            {rec.hourlyProduction.map((h, idx) => (
                              <li key={idx}>{h.hour}: {h.productionCount}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
