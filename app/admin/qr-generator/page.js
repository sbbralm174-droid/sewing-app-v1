"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import Select from "react-select";

export default function QRBulkGeneratorPage() {
  const [data, setData] = useState({ operators: [], machines: [] });
  const [selected, setSelected] = useState({ operators: [], machines: [] });
  const [generated, setGenerated] = useState({ operators: [], machines: [] });

  // Search input track korar jonno state
  const [opSearch, setOpSearch] = useState("");
  const [macSearch, setMacSearch] = useState("");

  const printRef = useRef(null);

  /* ================= 1. FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [opRes, macRes] = await Promise.all([
          fetch("/api/operators"),
          fetch("/api/machines"),
        ]);

        setData({
          operators: await opRes.json(),
          machines: await macRes.json(),
        });
      } catch (e) {
        console.error("Data fetch error:", e);
      }
    };
    fetchData();
  }, []);

  /* ================= 2. CUSTOM FILTER LOGIC ================= */
  const getFilteredOptions = (items, searchText, type) => {
    const baseOptions = items.map((item) => ({
      value: item._id,
      label: type === "op" 
        ? `${item.operatorId} - ${item.name}` 
        : `${item.uniqueId} - ${item.machineType?.name || "N/A"}`,
      item: item,
    }));

    // Filter by search text
    const filteredResults = baseOptions.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    );

    // Return list with "Select All" at the top
    return [
      {
        value: "__all__",
        label: searchText 
          ? `✅ Select Filtered (${filteredResults.length})` 
          : "✅ Select All",
        filtered: filteredResults,
      },
      ...filteredResults,
    ];
  };

  const opOptions = useMemo(() => getFilteredOptions(data.operators, opSearch, "op"), [data.operators, opSearch]);
  const macOptions = useMemo(() => getFilteredOptions(data.machines, macSearch, "mac"), [data.machines, macSearch]);

  /* ================= 3. GENERATE QR LOGIC ================= */
  const generateQRs = async () => {
    const process = async (list, type) =>
      Promise.all(
        list.map(async ({ item }) => {
          const qrData = type === "op"
            ? { type: "operator", id: item._id, operatorId: item.operatorId, name: item.name }
            : { type: "machine", id: item._id, uniqueId: item.uniqueId };

          const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), { width: 400, margin: 1 });
          return { ...item, qrCode: qrCodeUrl };
        })
      );

    setGenerated({
      operators: await process(selected.operators, "op"),
      machines: await process(selected.machines, "mac"),
    });
  };

  const handlePrint = useReactToPrint({ contentRef: printRef });

  /* ================= 4. STATUS COLOR & CARD ================= */
  const getStatusColor = (installDate) => {
    if (!installDate) return "#d1d5db";
    const today = new Date();
    const installation = new Date(installDate.$date || installDate);
    const diffYears = (today - installation) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears <= 1) return "#22c55e";
    if (diffYears <= 3) return "#eab308";
    return "#ef4444";
  };

  const Card = ({ item, type }) => {
    const rawDate = item.installationDate?.$date || item.installationDate;
    const installDateFormatted = rawDate ? new Date(rawDate).toLocaleDateString("en-GB") : "N/A";
    
    const showColorBar = type === "mac";
    const colorCode = showColorBar ? getStatusColor(item.installationDate) : "#fff";

    // টেক্সট যদি অনেক বড় হয় তবে ফন্ট সাইজ কমিয়ে দেওয়ার জন্য এই স্টাইলটি সাহায্য করবে
    const textContainerStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      padding: "2px 4px",
      textAlign: "center",
      overflow: "hidden", // বক্সের বাইরে যাবে না
      wordBreak: "break-word", // লম্বা শব্দ ভেঙে দেবে
      maxWidth: showColorBar ? "calc(63mm - 12mm - 5px)" : "100%", 
    };

    return (
      <div style={{
        height: "67mm", width: "63mm", border: "1px solid black",
        display: "flex", flexDirection: "column", backgroundColor: "#fff", breakInside: "avoid"
      }}>
        {/* Header (ID/Name) */}
        <div style={{ textAlign: "center", padding: "5px 2px", borderBottom: "0.5px solid #eee" }}>
          <h2 style={{ 
            fontWeight: 900, 
            fontSize: "14px", 
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis" // নাম খুব বড় হলে ডট ডট (...) দেখাবে
          }}>
            {type === "op" ? item.name : item.uniqueId}
          </h2>
        </div>

        {/* QR Code Section */}
        <div style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "5px" }}>
          <img src={item.qrCode} style={{ width: "150px", height: "150px" }} alt="qr" />
        </div>

        {/* Footer Info Section */}
        <div style={{ display: "flex", borderTop: "1px solid black", height: "18mm" }}>
          <div style={textContainerStyle}>
            {/* Machine Type / Designation - Font Auto Control */}
            <p style={{ 
              fontSize: (type === "mac" && item.machineType?.name?.length > 25) ? "7px" : "9px", 
              fontWeight: "bold", 
              margin: 0,
              lineHeight: "1.1",
              textTransform: "uppercase"
            }}>
              {type === "op" ? item.designation : item.machineType?.name || "N/A"}
            </p>

            <p style={{ fontSize: "9px", fontWeight: "bold", margin: "2px 0 0 0" }}>
              {type === "op" ? item.operatorId : ""}
            </p>
            <p style={{ fontSize: "9px", fontWeight: "bold", margin: "2px 0 0 0" }}>
              {type === "op" && item.joiningDate
                ? new Date(item.joiningDate).toLocaleDateString("en-GB")
                : ""}
            </p>

            {type === "mac" && (
              <>
                <p style={{ fontSize: "8px", fontWeight: 900, margin: 0 }}>
                  INST: {installDateFormatted}
                </p>
                <p style={{ 
                  fontSize: item.companyUniqueNumber?.length > 15 ? "7px" : "8px", 
                  fontWeight: 900, 
                  margin: 0,
                  overflow: "hidden"
                }}>
                  co-se-no: {item.companyUniqueNumber}
                </p>
              </>
            )}
          </div>

          {showColorBar && (
            <div style={{ width: "12mm", backgroundColor: colorCode, borderLeft: "1px solid black" }} />
          )}
        </div>
      </div>
    );
  };

  /* ================= 5. RENDER UI ================= */
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="no-print max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Bulk QR Generator</h1>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* OPERATORS SELECT */}
          <div>
            <label className="block text-sm font-bold mb-2">Select Operators</label>
            <Select
              isMulti
              options={opOptions}
              value={selected.operators}
              inputValue={opSearch}
              onInputChange={(val) => setOpSearch(val)}
              filterOption={() => true} // This is key to keep "Select All" visible
              closeMenuOnSelect={false}
              onChange={(values, action) => {
                if (action.action === "select-option" && action.option.value === "__all__") {
                  const alreadySelectedIds = new Set(selected.operators.map(s => s.value));
                  const toAdd = action.option.filtered.filter(f => !alreadySelectedIds.has(f.value));
                  setSelected({ ...selected, operators: [...selected.operators, ...toAdd] });
                  setOpSearch(""); // Clear search after bulk select
                } else {
                  setSelected({ ...selected, operators: (values || []).filter(v => v.value !== "__all__") });
                }
              }}
            />
          </div>

          {/* MACHINES SELECT */}
          <div>
            <label className="block text-sm font-bold mb-2">Select Machines</label>
            <Select
              isMulti
              options={macOptions}
              value={selected.machines}
              inputValue={macSearch}
              onInputChange={(val) => setMacSearch(val)}
              filterOption={() => true}
              closeMenuOnSelect={false}
              onChange={(values, action) => {
                if (action.action === "select-option" && action.option.value === "__all__") {
                  const alreadySelectedIds = new Set(selected.machines.map(s => s.value));
                  const toAdd = action.option.filtered.filter(f => !alreadySelectedIds.has(f.value));
                  setSelected({ ...selected, machines: [...selected.machines, ...toAdd] });
                  setMacSearch("");
                } else {
                  setSelected({ ...selected, machines: (values || []).filter(v => v.value !== "__all__") });
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 border-t pt-4">
          <button onClick={generateQRs} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold">
            Generate Cards
          </button>
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold">
            Print A4
          </button>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="flex justify-center mt-10">
        <div ref={printRef} className="grid grid-cols-3 gap-1 bg-white p-1 shadow-lg" style={{ width: "210mm" }}>
          {generated.operators.map((op, i) => (
            <Card key={`op-${i}`} item={op} type="op" />
          ))}
          {generated.machines.map((m, i) => (
            <Card key={`mac-${i}`} item={m} type="mac" />
          ))}
        </div>
      </div>
    </div>
  );
}