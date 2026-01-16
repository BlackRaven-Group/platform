import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2, Database, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UploadStats {
  total: number;
  processed: number;
  inserted: number;
  duplicates: number;
  errors: number;
}

interface CsvUploaderProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export default function CsvUploader({ onComplete, onClose }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractCoordinatesFromUrl = (url: string): { lat: number; lng: number } | null => {
    const searchMatch = url.match(/maps\/search\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (searchMatch) {
      return {
        lat: parseFloat(searchMatch[1]),
        lng: parseFloat(searchMatch[2])
      };
    }

    const placeMatch = url.match(/maps\/place\/[^/]+\/data=.*?@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2])
      };
    }

    const generalMatch = url.match(/(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/);
    if (generalMatch) {
      return {
        lat: parseFloat(generalMatch[1]),
        lng: parseFloat(generalMatch[2])
      };
    }

    return null;
  };

  const detectPinType = (title: string, note: string): { type: string; agency?: string; category: string } => {
    const text = `${title} ${note}`.toLowerCase();

    if (text.includes('lock')) return { type: 'lock', category: 'Locks' };
    if (text.includes('tomb') || text.includes('tombe')) return { type: 'tomb', category: 'Archaeological Sites' };
    if (text.includes('submarine') || text.includes('snle') || text.includes('sous-marin')) return { type: 'submarine', category: 'Naval Assets' };
    if (text.includes('factory') || text.includes('base') || text.includes('barracks') || text.includes('facility')) return { type: 'facility', category: 'Military Facilities' };

    const agencies = [
      { names: ['cia'], category: 'CIA' },
      { names: ['dgse', 'dgsi'], category: 'DGSE' },
      { names: ['mi6'], category: 'MI6' },
      { names: ['fsb'], category: 'FSB' },
      { names: ['dli', 'dini'], category: 'DLI' },
      { names: ['bnd'], category: 'BND' },
      { names: ['nzsis', 'asis'], category: 'NZSIS' },
      { names: ['mossad'], category: 'Mossad' }
    ];

    for (const agency of agencies) {
      for (const name of agency.names) {
        if (text.includes(name)) {
          return { type: 'agency', agency: agency.category, category: agency.category };
        }
      }
    }

    if (text.match(/\d+yo/) || text.includes('man') || text.includes('woman')) {
      return { type: 'person', category: 'Personnel' };
    }

    return { type: 'other', category: 'Other' };
  };

  const parseCSV = (text: string): any[] => {
    const pins: any[] = [];
    const rows = [];
    let currentRow = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"' && nextChar === '"') {
        currentRow += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === '\n' && !inQuotes) {
        if (currentRow.trim()) {
          rows.push(currentRow);
        }
        currentRow = '';
      } else {
        currentRow += char;
      }
    }

    if (currentRow.trim()) {
      rows.push(currentRow);
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const columns: string[] = [];
      let currentColumn = '';
      let inQuotes = false;

      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        const nextChar = row[j + 1];

        if (char === '"' && nextChar === '"') {
          currentColumn += '"';
          j++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(currentColumn);
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }

      columns.push(currentColumn);

      if (columns.length >= 3) {
        const title = columns[0].trim();
        const note = columns[1].trim();
        const url = columns[2].trim();

        const coords = extractCoordinatesFromUrl(url);
        if (coords) {
          const { type, agency, category } = detectPinType(title, note);

          pins.push({
            title: title || 'Pin',
            note: note || '',
            lat: coords.lat,
            lng: coords.lng,
            type,
            agency,
            category
          });
        }
      }
    }

    return pins;
  };

  const ensureTablesExist = async () => {
    const { error: pinsError } = await supabase
      .from('map_pins')
      .select('id')
      .limit(1);

    if (pinsError && pinsError.code === '42P01') {
      throw new Error('Database tables not initialized. Please run migrations first.');
    }
  };

  const uploadToDatabase = async (pins: any[]) => {
    const uploadStats: UploadStats = {
      total: pins.length,
      processed: 0,
      inserted: 0,
      duplicates: 0,
      errors: 0
    };

    const batchSize = 100;

    for (let i = 0; i < pins.length; i += batchSize) {
      const batch = pins.slice(i, i + batchSize);

      for (const pin of batch) {
        try {
          const { error } = await supabase
            .from('map_pins')
            .insert([pin])
            .select();

          if (error) {
            if (error.code === '23505') {
              uploadStats.duplicates++;
            } else {
              uploadStats.errors++;
              console.error('Insert error:', error);
            }
          } else {
            uploadStats.inserted++;
          }
        } catch (err) {
          uploadStats.errors++;
          console.error('Upload error:', err);
        }

        uploadStats.processed++;
        setStats({ ...uploadStats });
      }
    }

    return uploadStats;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStats(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setStats(null);

    try {
      await ensureTablesExist();

      const text = await file.text();
      const pins = parseCSV(text);

      if (pins.length === 0) {
        throw new Error('No valid pins found in CSV file');
      }

      const finalStats = await uploadToDatabase(pins);
      setStats(finalStats);

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload CSV Data</h2>
              <p className="text-sm text-slate-400">Import map pins from CSV file</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-200" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-700 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-white mb-1">Drop CSV file here</p>
                  <p className="text-sm text-slate-400">or</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Choose File
                </button>
                <p className="text-xs text-slate-500">
                  Supports CSV files with columns: Title, Note, URL
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Upload Failed</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {stats && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-white/10 border border-green-500/50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-zinc-200 flex-shrink-0" />
                <div>
                  <p className="text-zinc-200 font-medium">Upload Complete</p>
                  <p className="text-sm text-green-300 mt-1">
                    Successfully processed {stats.processed} pins
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm">Total Rows</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm">Inserted</p>
                  <p className="text-2xl font-bold text-zinc-200 mt-1">{stats.inserted}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.duplicates}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm">Errors</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{stats.errors}</p>
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 p-4">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <p className="text-white">Processing CSV file...</p>
              </div>
              {stats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white">
                      {stats.processed} / {stats.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(stats.processed / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Upload to Database
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Close
              </button>
            )}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> CSV files should have columns: Title, Note, URL with Google Maps coordinates.
              Duplicates (same coordinates) will be automatically skipped.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
