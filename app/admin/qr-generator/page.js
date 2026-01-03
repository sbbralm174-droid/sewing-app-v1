"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import Select from "react-select";

export default function QRBulkGeneratorPage() {
  const [data, setData] = useState({ operators: [], machines: [] });
  const [selected, setSelected] = useState({ operators: [], machines: [] });
  const [generated, setGenerated] = useState({ operators: [], machines: [] });

  const printRef = useRef(null);

  /* ================= FETCH DATA ================= */
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
        console.error(e);
      }
    };

    fetchData();
  }, []);

  /* ================= SELECT OPTIONS ================= */
  const options = useMemo(() => {
    const operatorOptions = data.operators.map((o) => ({
      value: o._id,
      label: `${o.operatorId} - ${o.name}`,
      item: o,
    }));

    const machineOptions = data.machines.map((m) => ({
      value: m._id,
      label: `${m.uniqueId} - ${m.machineType?.name || "N/A"}`,
      item: m,
    }));

    return {
      operators: [
        { value: "__all__", label: "✅ Select All Operators" },
        ...operatorOptions,
      ],
      machines: [
        { value: "__all__", label: "✅ Select All Machines" },
        ...machineOptions,
      ],
    };
  }, [data]);

  /* ================= GENERATE QR ================= */
  const generateQRs = async () => {
    const process = async (list, type) =>
      Promise.all(
        list.map(async ({ item }) => {
          const qrData =
            type === "op"
              ? { type: "operator", id: item._id, operatorId: item.operatorId }
              : { type: "machine", id: item._id, uniqueId: item.uniqueId };

          const qrCodeUrl = await QRCode.toDataURL(
            JSON.stringify(qrData),
            { width: 400, margin: 1 }
          );

          return { ...item, qrCode: qrCodeUrl };
        })
      );

    setGenerated({
      operators: await process(selected.operators, "op"),
      machines: await process(selected.machines, "mac"),
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  /* ================= STATUS COLOR ================= */
  const getStatusColor = (installDate) => {
    if (!installDate) return "#d1d5db";

    const today = new Date();
    const installation = new Date(installDate.$date || installDate);
    const diffYears =
      (today - installation) / (1000 * 60 * 60 * 24 * 365.25);

    if (diffYears <= 1) return "#22c55e";
    if (diffYears <= 3) return "#eab308";
    return "#ef4444";
  };

  /* ================= CARD ================= */
  const Card = ({ item, type }) => {
    const rawDate = item.installationDate?.$date || item.installationDate;
    const installDateFormatted = rawDate
      ? new Date(rawDate).toLocaleDateString("en-GB")
      : "N/A";

    const colorCode = getStatusColor(item.installationDate);

    return (
      <div
        style={{
          height: "67mm",
          width: "63mm",
          border: "1px solid black",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
          breakInside: "avoid",
        }}
      >
        <div style={{ textAlign: "center", padding: "5px 0" }}>
          <h2 style={{ fontWeight: 900, fontSize: "15px", margin: 0 }}>
            {type === "op" ? item.name : item.uniqueId}
          </h2>
        </div>

        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img src={item.qrCode} style={{ width: 170 }} alt="qr" />
        </div>

        <div style={{ display: "flex", borderTop: "1px solid black" }}>
          <div style={{ flex: 1, padding: "4px 8px" }}>
            <p style={{ fontSize: "9px", fontWeight: "bold", margin: 0 }}>
              {type === "op"
                ? item.designation
                : item.machineType?.name || "N/A"}
            </p>
            <p style={{ fontSize: "12px", fontWeight: 900, margin: 0 }}>
              INST: {installDateFormatted}
            </p>
          </div>

          <div
            style={{
              width: "12mm",
              backgroundColor: colorCode,
              borderLeft: "1px solid black",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />
        </div>
      </div>
    );
  };

  /* ================= UI ================= */
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="no-print max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">
          Bulk QR Printer (12 per page)
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* OPERATORS */}
          <Select
            isMulti
            options={options.operators}
            placeholder="Operators..."
            onChange={(values) => {
              if (values?.some((v) => v.value === "__all__")) {
                setSelected({
                  ...selected,
                  operators: options.operators.filter(
                    (v) => v.value !== "__all__"
                  ),
                });
              } else {
                setSelected({ ...selected, operators: values });
              }
            }}
          />

          {/* MACHINES */}
          <Select
            isMulti
            options={options.machines}
            placeholder="Machines..."
            onChange={(values) => {
              if (values?.some((v) => v.value === "__all__")) {
                setSelected({
                  ...selected,
                  machines: options.machines.filter(
                    (v) => v.value !== "__all__"
                  ),
                });
              } else {
                setSelected({ ...selected, machines: values });
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateQRs}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generate
          </button>
          <button
            onClick={handlePrint}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Print A4
          </button>
        </div>
      </div>

      <div className="flex justify-center bg-gray-300 py-10">
        <div
          ref={printRef}
          className="grid grid-cols-3 gap-1 bg-white p-1"
          style={{ width: "210mm" }}
        >
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
