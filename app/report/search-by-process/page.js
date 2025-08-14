"use client";
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

  // Filtered processes for search input
  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">
        🔍 Search Operators by Process
      </h2>

      {/* Searchable Multi-Select */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Search & Select Processes</label>
        <input
          type="text"
          placeholder="Type to filter processes..."
          className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
          {filteredProcesses.map((p) => (
            <label key={p._id} className="block text-gray-800 cursor-pointer mb-1">
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
        className="mb-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Search
      </button>

      {/* Results */}
      <div className="mt-4">
        {loading && <p className="text-gray-500">Searching...</p>}
        {!loading && results.length === 0 && (
          <p className="text-gray-500">No operators found</p>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          {results.map((op) => (
            <div
              key={op._id}
              className="border border-gray-200 p-5 rounded-lg shadow-md hover:shadow-lg transition bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{op.name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    op.status === "present"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {op.status || "absent"}
                </span>
              </div>
              <p className="text-gray-700"><strong>ID:</strong> {op.operatorId}</p>
              <p className="text-gray-700"><strong>Designation:</strong> {op.designation}</p>
              <p className="text-gray-700 mt-2">
                <strong>Processes:</strong>{" "}
                <span className="text-blue-600">{op.allowedProcesses.join(", ")}</span>
              </p>
              <button
                onClick={() => handleViewOperator(op)}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition font-medium"
              >
                View Operator
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded-lg w-11/12 md:w-3/4 p-6 max-h-[80vh] overflow-y-auto relative shadow-xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 font-bold text-lg"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Operator: {modalOperator?.name}
            </h2>
            {modalLoading && <p className="text-gray-500">Loading records...</p>}
            {!modalLoading && modalData.length === 0 && (
              <p className="text-gray-500">No records found</p>
            )}
            {!modalLoading && modalData.length > 0 && (
              <div className="space-y-4">
                {modalData.map((rec) => (
                  <div
                    key={rec._id}
                    className="border p-3 rounded shadow-sm text-black bg-gray-50"
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
                        <ul className="list-disc ml-5 text-gray-700">
                          {rec.hourlyProduction.map((h, idx) => (
                            <li key={idx}>
                              {h.hour}: {h.productionCount}
                            </li>
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
  );
}
