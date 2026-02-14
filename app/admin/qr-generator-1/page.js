"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import Select from "react-select";

export default function QRBulkGeneratorPage() {
  const [data, setData] = useState({ operators: [], machines: [] });
  const [selected, setSelected] = useState({ operators: [], machines: [] });
  const [generated, setGenerated] = useState({ operators: [], machines: [] });

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

    const filteredResults = baseOptions.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    );

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

          const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), { width: 300, margin: 1 });
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

    const textContainerStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      padding: "1px 2px",
      textAlign: "center",
      overflow: "hidden",
      wordBreak: "break-word",
      maxWidth: showColorBar ? "calc(48mm - 10mm - 4px)" : "100%", 
    };

    return (
      <div style={{
        height: "68mm", // A4 height is ~297mm. 68mm x 4 = 272mm (fits safely)
        width: "48mm",  // A4 width is 210mm. 48mm x 4 = 192mm (fits safely)
        border: "1px solid #000",
        display: "flex", 
        flexDirection: "column", 
        backgroundColor: "#fff", 
        breakInside: "avoid",
        boxSizing: "border-box",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", padding: "4px 2px", borderBottom: "0.5px solid #eee" }}>
          <h2 style={{ 
            fontWeight: 900, 
            fontSize: "11px", 
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {type === "op" ? item.name : item.uniqueId}
          </h2>
        </div>

        {/* QR Code Section */}
        <div style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2px" }}>
          <img src={item.qrCode} style={{ width: "120px", height: "120px" }} alt="qr" />
        </div>

        {/* Footer Info Section */}
        <div style={{ display: "flex", borderTop: "1px solid black", height: "18mm" }}>
          <div style={textContainerStyle}>
            <p style={{ 
              fontSize: "8px", 
              fontWeight: "bold", 
              margin: 0,
              lineHeight: "1.1",
              textTransform: "uppercase"
            }}>
              {type === "op" ? item.designation : item.machineType?.name || "N/A"}
            </p>

            <p style={{ fontSize: "8px", fontWeight: "bold", margin: "1px 0" }}>
              {type === "op" ? item.operatorId : ""}
            </p>
            
            {type === "mac" && (
              <>
                <p style={{ fontSize: "7px", fontWeight: 900, margin: 0 }}>
                  INST: {installDateFormatted}
                </p>
                <p style={{ 
                  fontSize: "7px", 
                  fontWeight: 900, 
                  margin: 0,
                  overflow: "hidden"
                }}>
                  SN: {item.companyUniqueNumber}
                </p>
              </>
            )}
          </div>

          {showColorBar && (
            <div style={{ width: "10mm", backgroundColor: colorCode, borderLeft: "1px solid black" }} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="no-print max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Bulk QR Generator (4x4 Grid)</h1>

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
              filterOption={() => true}
              closeMenuOnSelect={false}
              onChange={(values, action) => {
                if (action.action === "select-option" && action.option.value === "__all__") {
                  const alreadySelectedIds = new Set(selected.operators.map(s => s.value));
                  const toAdd = action.option.filtered.filter(f => !alreadySelectedIds.has(f.value));
                  setSelected({ ...selected, operators: [...selected.operators, ...toAdd] });
                  setOpSearch("");
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
            Print A4 (16 per page)
          </button>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="flex justify-center mt-10">
        <div 
          ref={printRef} 
          className="grid grid-cols-4 gap-1 bg-white p-2" 
          style={{ 
            width: "210mm", 
            minHeight: "297mm",
            paddingLeft: "5mm",
            paddingRight: "5mm"
          }}
        >
          {generated.operators.map((op, i) => (
            <Card key={`op-${i}`} item={op} type="op" />
          ))}
          {generated.machines.map((m, i) => (
            <Card key={`mac-${i}`} item={m} type="mac" />
          ))}
        </div>
      </div>
      
      {/* CSS to ensure clean printing */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}