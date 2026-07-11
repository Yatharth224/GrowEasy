"use client";

import { useState } from "react";
import Papa from "papaparse";

// Maps each crm_status value to a color, so the badges look like a real CRM
const STATUS_STYLES = {
  GOOD_LEAD_FOLLOW_UP: { bg: "#e6f7ec", color: "#1a7f42", label: "Good Lead" },
  DID_NOT_CONNECT: { bg: "#f1f2f6", color: "#6b7280", label: "Not Connected" },
  BAD_LEAD: { bg: "#fdecec", color: "#c0392b", label: "Bad Lead" },
  SALE_DONE: { bg: "#eaf0ff", color: "#3457d5", label: "Sale Done" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: "#f1f2f6", color: "#6b7280", label: "Unknown" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status ? style.label : "-"}
    </span>
  );
}

// Formats an ISO date string into something readable, e.g. "Jul 13, 2026, 2:20 PM"
function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [csvRows, setCsvRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // which imported row is expanded

  function parseCsvFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }

    setFileName(file.name);
    setError("");
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (parsedData) {
        setCsvRows(parsedData.data);
      },
      error: function () {
        setError("Could not read the CSV file. Please try a valid file.");
      },
    });
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    parseCsvFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    parseCsvFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleReset() {
    setCsvRows([]);
    setFileName("");
    setResult(null);
    setError("");
    setExpandedRow(null);
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/import/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: csvRows }),
      });

      if (!response.ok) {
        throw new Error("Server returned an error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(index) {
    setExpandedRow(expandedRow === index ? null : index);
  }

  return (
    <main className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f7f8fc 0%, #eef1f8 100%);
          padding: 32px 16px 60px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          color: #171923;
        }

        .container { max-width: 1100px; margin: 0 auto; }

        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }

        .logo-badge {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #5b7cff, #8a5bff);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 16px; flex-shrink: 0;
        }

        .header-text h1 { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px; }
        .header-text p { color: #6b7280; margin: 2px 0 0 0; font-size: 13.5px; }

        .card {
          background: #ffffff; border-radius: 14px; padding: 24px;
          box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 1px 6px rgba(16,24,40,0.06);
          margin-bottom: 18px; border: 1px solid #eef0f4;
        }

        .dropzone {
          border: 2px dashed #d5d9e3; border-radius: 12px; padding: 48px 20px;
          text-align: center; cursor: pointer; display: block;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
        }
        .dropzone:hover { border-color: #a8b4ff; background: #fafbff; }
        .dropzone.dragging { border-color: #5b7cff; background: #f0f3ff; transform: scale(1.005); }
        .dropzone-icon { font-size: 30px; margin-bottom: 10px; }
        .dropzone-title { font-weight: 600; font-size: 15.5px; margin-bottom: 4px; color: #1f2330; }
        .dropzone-sub { font-size: 13px; color: #8a8f9c; }
        .file-input { display: none; }

        .file-chip {
          display: inline-flex; align-items: center; gap: 8px; background: #eef1f8;
          padding: 7px 14px; border-radius: 20px; font-size: 13px; margin-top: 16px; font-weight: 500;
        }

        .error-box {
          background: #fdecec; color: #c0392b; padding: 12px 16px; border-radius: 10px;
          font-size: 13.5px; margin-bottom: 16px; border: 1px solid #f8d3d3;
        }

        .section-title {
          font-size: 15.5px; font-weight: 700; margin: 0 0 14px 0;
          display: flex; align-items: center; gap: 8px; justify-content: space-between;
        }

        .section-title-left { display: flex; align-items: center; gap: 8px; }

        .badge {
          font-size: 12px; font-weight: 600; padding: 2px 9px; border-radius: 20px;
          background: #eef1f8; color: #4b5563;
        }

        .table-wrap {
          overflow-x: auto; overflow-y: auto; max-height: 460px;
          border: 1px solid #eef0f4; border-radius: 10px;
        }

        table { border-collapse: collapse; width: 100%; font-size: 13px; }

        thead th {
          position: sticky; top: 0; background: #f8f9fc; text-align: left;
          padding: 11px 14px; border-bottom: 1px solid #eef0f4; white-space: nowrap;
          font-weight: 600; color: #4b5563; z-index: 1;
        }

        tbody td {
          padding: 12px 14px; border-bottom: 1px solid #f4f5f8;
          white-space: nowrap; color: #374151; vertical-align: middle;
        }

        tbody tr.clickable { cursor: pointer; }
        tbody tr.clickable:hover { background: #fafbfd; }

        .lead-name { font-weight: 600; color: #1f2330; }
        .sub-text { font-size: 12px; color: #9ca3af; }

        .expand-row td {
          background: #fafbfd;
          white-space: normal;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          padding: 4px 0;
        }

        .detail-item .detail-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;
          color: #9ca3af; font-weight: 600; margin-bottom: 2px;
        }

        .detail-item .detail-value {
          font-size: 13px; color: #374151;
        }

        .btn-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }

        .btn {
          padding: 11px 22px; border-radius: 9px; border: none; font-size: 14px;
          font-weight: 600; cursor: pointer; display: inline-flex; align-items: center;
          gap: 8px; transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .btn:active { transform: scale(0.98); }
        .btn-primary { background: linear-gradient(135deg, #5b7cff, #7a5bff); color: white; }
        .btn-primary:disabled { background: #c7cfef; cursor: not-allowed; }
        .btn-secondary { background: #f1f2f6; color: #374151; }

        .spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.5);
          border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .stats-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }

        .stat-card {
          flex: 1; min-width: 200px; border-radius: 14px; padding: 20px 22px;
          display: flex; align-items: center; gap: 14px;
        }
        .stat-card.imported { background: linear-gradient(135deg, #eafcef, #e2f8ea); border: 1px solid #d3f2dd; }
        .stat-card.skipped { background: linear-gradient(135deg, #fdecec, #fbe4e4); border: 1px solid #f6d3d3; }
        .stat-icon { font-size: 26px; }
        .stat-number { font-size: 28px; font-weight: 800; line-height: 1; }
        .stat-label { font-size: 13px; color: #4b5563; margin-top: 4px; }

        .skipped-table thead th { background: #fdecec; }

        .expand-icon {
          font-size: 11px; color: #9ca3af; margin-left: 6px;
        }

        @media (max-width: 640px) {
          .header-text h1 { font-size: 18px; }
          .card { padding: 16px; }
          .dropzone { padding: 32px 14px; }
          .stat-card { min-width: 100%; }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <div className="logo-badge">GE</div>
          <div className="header-text">
            <h1>GrowEasy CSV Importer</h1>
            <p>Upload a CSV in any format - AI maps it into GrowEasy CRM fields automatically</p>
          </div>
        </div>

        {/* Step 1: Upload */}
        {!result && (
          <div className="card">
            <label
              htmlFor="csv-input"
              className={`dropzone ${isDragging ? "dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="dropzone-icon">📄</div>
              <div className="dropzone-title">Drop your CSV file here</div>
              <div className="dropzone-sub">or click to browse files</div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="file-input"
                onChange={handleFileUpload}
              />
            </label>

            {fileName && (
              <div className="file-chip">📎 {fileName} &middot; {csvRows.length} rows</div>
            )}
          </div>
        )}

        {error && <div className="error-box">⚠️ {error}</div>}

        {/* Step 2: Raw preview - exactly what's in the CSV, no AI touch yet */}
        {csvRows.length > 0 && !result && (
          <div className="card">
            <div className="section-title">
              <div className="section-title-left">
                Preview <span className="badge">{csvRows.length} rows</span>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {Object.keys(csvRows[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(csvRows[0]).map((col) => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="btn-row">
              <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading && <span className="spinner"></span>}
                {loading ? "Processing with AI..." : "Confirm Import"}
              </button>
              <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result - styled like a real CRM leads table */}
        {result && (
          <div>
            <div className="stats-row">
              <div className="stat-card imported">
                <div className="stat-icon"></div>
                <div>
                  <div className="stat-number">{result.total_imported}</div>
                  <div className="stat-label">Total Imported</div>
                </div>
              </div>
              <div className="stat-card skipped">
                <div className="stat-icon"></div>
                <div>
                  <div className="stat-number">{result.total_skipped}</div>
                  <div className="stat-label">Total Skipped</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">
                <div className="section-title-left">
                  Your Leads <span className="badge">{result.imported.length}</span>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Contact</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.imported.map((lead, index) => (
                      <>
                        <tr
                          key={index}
                          className="clickable"
                          onClick={() => toggleExpand(index)}
                        >
                          <td>
                            <div className="lead-name">{lead.name || "-"}</div>
                            <div className="sub-text">{lead.email || "no email"}</div>
                          </td>
                          <td>
                            {lead.mobile_without_country_code
                              ? `${lead.country_code || ""} ${lead.mobile_without_country_code}`
                              : "-"}
                          </td>
                          <td>{lead.company || "-"}</td>
                          <td>
                            {[lead.city, lead.state].filter(Boolean).join(", ") || "-"}
                          </td>
                          <td><StatusBadge status={lead.crm_status} /></td>
                          <td>
                            {formatDate(lead.created_at)}
                            <span className="expand-icon">
                              {expandedRow === index ? "▲ less" : "▼ more"}
                            </span>
                          </td>
                        </tr>

                        {expandedRow === index && (
                          <tr className="expand-row" key={`expand-${index}`}>
                            <td colSpan={6}>
                              <div className="detail-grid">
                                <div className="detail-item">
                                  <div className="detail-label">Lead Owner</div>
                                  <div className="detail-value">{lead.lead_owner || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">Data Source</div>
                                  <div className="detail-value">{lead.data_source || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">Possession Time</div>
                                  <div className="detail-value">{lead.possession_time || "-"}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">Country</div>
                                  <div className="detail-value">{lead.country || "-"}</div>
                                </div>
                                <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                                  <div className="detail-label">CRM Note</div>
                                  <div className="detail-value">{lead.crm_note || "-"}</div>
                                </div>
                                <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                                  <div className="detail-label">Description</div>
                                  <div className="detail-value">{lead.description || "-"}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {result.skipped.length > 0 && (
              <div className="card">
                <div className="section-title">
                  <div className="section-title-left">
                    Skipped Records <span className="badge">{result.skipped.length}</span>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="skipped-table">
                    <thead>
                      <tr>
                        <th>Reason</th>
                        <th>Row Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.skipped.map((item, index) => (
                        <tr key={index}>
                          <td>{item.reason}</td>
                          <td>{JSON.stringify(item.row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-primary" onClick={handleReset}>
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}