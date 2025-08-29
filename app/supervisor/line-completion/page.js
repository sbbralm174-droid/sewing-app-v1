"use client";
import { useState, useEffect } from "react";

export default function LineCompletion() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [floors, setFloors] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [completionStatuses, setCompletionStatuses] = useState([]); // Array to store statuses

  // Fetch all floors from the API
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const result = await res.json();
        if (Array.isArray(result)) {
          // Extract unique floors
          const uniqueFloors = [...new Set(result.map(lineItem => lineItem.floor?.floorName).filter(Boolean))];
          setFloors(uniqueFloors);
        }
      } catch (err) {
        console.error("Error fetching floors", err);
      }
    };
    fetchFloors();
  }, []);

  // Fetch lines based on the selected floor and fetch completion status for those lines
  useEffect(() => {
    const fetchData = async () => {
      setCompletionStatuses([]);
      if (selectedFloor) {
        setLoading(true);
        try {
          // Fetch all floor lines
          const floorLinesRes = await fetch("/api/floor-lines");
          const floorLinesResult = await floorLinesRes.json();

          // Filter lines for the selected floor
          const linesForFloor = floorLinesResult.filter(lineItem => lineItem.floor?.floorName === selectedFloor);
          setLines(linesForFloor.map(item => item.lineNumber));

          // Fetch all completion statuses for the selected date and floor
          const completionRes = await fetch(`/api/line-completion?date=${date}&floor=${selectedFloor}`);
          if (!completionRes.ok) {
            throw new Error('Failed to fetch completion statuses');
          }
          const completionData = await completionRes.json();
          setCompletionStatuses(completionData);

        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load data.");
        } finally {
          setLoading(false);
        }
      } else {
        setLines([]);
      }
    };
    fetchData();
  }, [selectedFloor, date]);

  // Handle marking a line as complete
  const handleMarkComplete = async () => {
    if (!date || !selectedFloor || !selectedLine || !supervisor) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/line-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          floor: selectedFloor,
          line: selectedLine,
          supervisor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccessMessage("Line successfully marked as complete!");
      
      // Update the completion statuses list after a successful save
      setCompletionStatuses(prev => {
        const newStatus = { date, floor: selectedFloor, line: selectedLine, supervisor, completedAt: new Date() };
        const existingIndex = prev.findIndex(s => s.line === selectedLine);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = newStatus;
          return updated;
        } else {
          return [...prev, newStatus];
        }
      });

    } catch (err) {
      setError(err.message || "Failed to save data.");
    } finally {
      setLoading(false);
    }
  };

  const getCompletionStatus = (line) => {
    return completionStatuses.find(s => s.line === line);
  };

  return (
    <div className="p-6 bg-[#1A1B22] text-[#E5E9F0] font-sans min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Line Completion Status</h2>

      <div className="flex flex-col gap-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        />
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        >
          <option value="">Select a floor</option>
          {floors.map((fl, idx) => (
            <option key={idx} value={fl}>
              {fl}
            </option>
          ))}
        </select>
        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
          disabled={!selectedFloor}
        >
          <option value="">Select a line</option>
          {lines.map((ln, idx) => (
            <option key={idx} value={ln}>
              {ln}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
          placeholder="Supervisor's Name"
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        />
        <button
          onClick={handleMarkComplete}
          className="bg-green-600 text-[#E5E9F0] px-6 py-2 rounded font-semibold"
          disabled={loading || !selectedLine || !supervisor}
        >
          {loading ? "Saving..." : "Mark as Complete"}
        </button>
      </div>

      {loading && <p className="text-gray-400">Saving data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      <div className="mt-8 p-4 border border-[#2D3039] rounded">
        <h3 className="text-lg font-bold mb-4">Completion Status</h3>
        {completionStatuses.length > 0 ? (
          <div className="space-y-4">
            {lines.map((line, idx) => {
              const status = getCompletionStatus(line);
              return (
                <div key={idx} className="bg-[#2D3039] p-4 rounded-md flex justify-between items-center">
                  <div>
                    <p><span className="font-semibold">Line:</span> {line}</p>
                    {status ? (
                      <p className="text-green-400 font-semibold mt-1">Complete</p>
                    ) : (
                      <p className="text-yellow-400 font-semibold mt-1">Incomplete</p>
                    )}
                  </div>
                  {status && (
                    <div className="text-right text-sm text-gray-400">
                      <p>Supervisor: {status.supervisor}</p>
                      <p>Completed: {new Date(status.completedAt).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-yellow-400">No completion status found for this floor.</p>
        )}
      </div>
    </div>
  );
}
