'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FieldDef {
  name: string;
  type: string;
  required?: boolean;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  fields: FieldDef[];
  onImportComplete: (summary: { importedCount: number; failedCount: number; errors: any[] }) => void;
  appId: string;
}

export default function CSVImportModal({
  isOpen,
  onClose,
  modelName,
  fields,
  onImportComplete,
  appId,
}: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // CSV Header -> Schema Field Name
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        const parsedData = results.data as any[];
        if (parsedData.length === 0) {
          setError('CSV file is empty');
          return;
        }

        const headers = Object.keys(parsedData[0] || {});
        setCsvHeaders(headers);
        setParsedRows(parsedData);

        // Pre-fill smart mappings based on name matching
        const initialMappings: Record<string, string> = {};
        headers.forEach((hdr) => {
          const match = fields.find(
            (f) => f.name.toLowerCase() === hdr.trim().toLowerCase()
          );
          if (match) {
            initialMappings[hdr] = match.name;
          } else {
            initialMappings[hdr] = '';
          }
        });
        setMappings(initialMappings);
      },
      error: (err) => {
        setLoading(false);
        setError(`Failed to read file: ${err.message}`);
      },
    });
  };

  const handleMappingChange = (header: string, schemaField: string) => {
    setMappings({
      ...mappings,
      [header]: schemaField,
    });
  };

  const handleSubmitImport = async () => {
    setError('');
    
    // Check if at least one column is mapped
    const mappedFields = Object.values(mappings).filter((v) => v !== '');
    if (mappedFields.length === 0) {
      setError('Please map at least one column to a database field.');
      return;
    }

    // Verify required fields are mapped
    const missingRequired = fields.filter(
      (f) => f.required && !mappedFields.includes(f.name)
    );

    if (missingRequired.length > 0) {
      setError(
        `Required schema fields must be mapped: ${missingRequired
          .map((f) => f.name)
          .join(', ')}`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/apps/${appId}/csv-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName,
          mappings,
          data: parsedRows,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to complete CSV import');
      }

      onImportComplete({
        importedCount: result.importedCount,
        failedCount: result.failedCount,
        errors: result.errors || [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Import execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex justify-between items-center bg-zinc-900/60 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white">Import CSV to {modelName}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Map spreadsheet columns to your database structure.</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3.5 rounded-xl">
              {error}
            </div>
          )}

          {/* File Upload Selector */}
          {parsedRows.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-950/20 rounded-2xl p-12 text-center cursor-pointer transition duration-150"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <p className="text-zinc-350 text-base font-medium mb-1">
                {loading ? 'Reading document...' : 'Click to select CSV File'}
              </p>
              <p className="text-xs text-zinc-500">Only .csv spreadsheet files supported</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-zinc-200">{fileName}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Detected {csvHeaders.length} columns and {parsedRows.length} rows
                  </p>
                </div>
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setCsvHeaders([]);
                    setFileName('');
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold"
                >
                  Change File
                </button>
              </div>

              {/* Mappings Panel */}
              <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/20">
                <div className="grid grid-cols-2 gap-4 bg-zinc-900/80 px-4 py-3 border-b border-zinc-850 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <div>CSV Column Header</div>
                  <div>Map to DB Field</div>
                </div>

                <div className="divide-y divide-zinc-850 max-h-60 overflow-y-auto">
                  {csvHeaders.map((header) => (
                    <div key={header} className="grid grid-cols-2 gap-4 px-4 py-3.5 items-center">
                      <span className="text-sm font-bold truncate text-zinc-200">{header}</span>
                      <select
                        value={mappings[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                      >
                        <option value="">-- Ignored --</option>
                        {fields.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name} ({f.type}){f.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedRows.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-850 flex justify-end gap-3 bg-zinc-900/60 shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitImport}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/20 transition-colors"
            >
              {loading ? 'Importing Rows...' : `Import ${parsedRows.length} Rows`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
