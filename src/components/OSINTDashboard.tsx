import { useState, useEffect } from 'react';
import { Search, Database, AlertCircle, CheckCircle, Loader, ArrowRight, DollarSign, Info } from 'lucide-react';
import { executeOSINTSearch, getSearchHistory, type OSINTSearchResponse } from '../lib/osint';
import OSINTResults from './OSINTResults';

interface OSINTDashboardProps {
  dossierId?: string;
  onClose?: () => void;
}

export default function OSINTDashboard({ dossierId, onClose, onDossierCreated }: OSINTDashboardProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [searching, setSearching] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<OSINTSearchResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, [dossierId]);

  const loadSearchHistory = async () => {
    const history = await getSearchHistory(dossierId);
    setSearchHistory(history);
  };

  const calculateCost = (queryText: string, searchLimit: number): number => {
    const words = queryText
      .split(' ')
      .filter(word => {
        if (word.length < 4) return false;
        if (/^\d{1,5}$/.test(word)) return false;
        if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(word)) return false;
        return true;
      });

    let complexity = 1;
    if (words.length === 2) complexity = 5;
    else if (words.length === 3) complexity = 16;
    else if (words.length > 3) complexity = 40;

    const cost = (5 + Math.sqrt(searchLimit * complexity)) / 5000;
    return Math.round(cost * 10000) / 10000;
  };

  const estimatedCost = calculateCost(query, limit);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setSearching(true);

    try {
      const searchId = await executeOSINTSearch({
        query: query.trim(),
        limit,
        lang
      }, dossierId);

      if (searchId) {
        setCurrentSearchId(searchId);
        loadSearchHistory();
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleViewResults = (searchId: string) => {
    setCurrentSearchId(searchId);
  };

  const handleBackToSearch = () => {
    setCurrentSearchId(null);
    setQuery('');
    loadSearchHistory();
  };

  if (currentSearchId) {
    return (
      <OSINTResults
        searchId={currentSearchId}
        dossierId={dossierId}
        onBack={handleBackToSearch}
        onDossierCreated={onDossierCreated}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Database className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">OSINT OPERATIONS</h2>
            <p className="text-sm text-zinc-500">LeakOSINT Intelligence Gathering</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="terminal-button">
            CLOSE
          </button>
        )}
      </div>

      <div className="border-2 border-zinc-800 p-6 mb-6 bg-zinc-900/20">
        <div className="data-label mb-4">SEARCH CONFIGURATION:</div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="data-label text-xs">QUERY:</label>
            <div className="flex items-center space-x-2 text-xs text-zinc-500">
              <Info className="w-4 h-4" />
              <span>Use quotes "exact phrase" for precise matching</span>
            </div>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query (email, name, phone, username, etc.)&#10;Multiple queries: separate with newlines&#10;Exact match: use &quot;quotes&quot;"
            className="w-full bg-black border-2 border-zinc-800 text-zinc-200 p-4 font-mono focus:border-green-500 focus:outline-none resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="data-label text-xs mb-2 block">SEARCH LIMIT:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full bg-black border-2 border-zinc-800 text-zinc-200 p-2 font-mono focus:border-green-500 focus:outline-none"
            >
              <option value={100}>100 (Default)</option>
              <option value={300}>300 (Medium)</option>
              <option value={500}>500 (High)</option>
              <option value={1000}>1000 (Deep)</option>
              <option value={5000}>5000 (Extensive)</option>
              <option value={10000}>10000 (Maximum)</option>
            </select>
          </div>

          <div>
            <label className="data-label text-xs mb-2 block">LANGUAGE:</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'ru')}
              className="w-full bg-black border-2 border-zinc-800 text-zinc-200 p-2 font-mono focus:border-green-500 focus:outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="ru">Russian (RU)</option>
            </select>
          </div>
        </div>

        <div className="border border-zinc-800 p-3 mb-4 bg-black/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-white" />
              <span className="text-xs text-zinc-500">ESTIMATED COST:</span>
            </div>
            <span className="text-zinc-200 font-bold">${estimatedCost.toFixed(4)}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Formula: (5 + √(Limit × Complexity)) / 5000
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-white hover:text-zinc-200 flex items-center space-x-2"
          >
            <Info className="w-4 h-4" />
            <span>{showAdvanced ? 'HIDE' : 'SHOW'} SEARCH GUIDE</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="border border-zinc-800 p-4 mb-4 bg-black/30 text-xs text-zinc-500 space-y-2">
            <div className="font-bold text-white mb-2">SUPPORTED QUERY TYPES:</div>
            <div>📧 <span className="text-zinc-200">Email:</span> example@gmail.com, example@, @gmail.com</div>
            <div>👤 <span className="text-zinc-200">Name:</span> John Doe, John, Doe Smith</div>
            <div>📱 <span className="text-zinc-200">Phone:</span> +79002206090, 89002206090</div>
            <div>🔑 <span className="text-zinc-200">Password:</span> 123qwe</div>
            <div>📍 <span className="text-zinc-200">IP:</span> 127.0.0.1</div>
            <div>✈️ <span className="text-zinc-200">Telegram:</span> John Doe, 314159265, @username</div>
            <div>📘 <span className="text-zinc-200">Facebook:</span> John Doe, 314159265</div>
            <div>🌟 <span className="text-zinc-200">VK:</span> John Doe, 314159265</div>
            <div>📸 <span className="text-zinc-200">Instagram:</span> John Doe, 314159265</div>
            <div className="pt-2 mt-2 border-t border-zinc-800">
              <div className="font-bold text-white mb-1">ADVANCED:</div>
              <div>🔗 <span className="text-zinc-200">Combined:</span> John Doe +79002206090 example@gmail.com</div>
              <div>📋 <span className="text-zinc-200">Multiple:</span> Separate queries with newlines</div>
              <div>🎯 <span className="text-zinc-200">Exact:</span> "John Doe" (with quotes)</div>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-800 text-yellow-600">
              ⚠️ Rate Limit: 1 request per second. Batch multiple queries together.
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-950/30 border-2 border-red-900 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="terminal-button-primary w-full flex items-center justify-center space-x-2"
        >
          {searching ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>EXECUTING SEARCH...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>EXECUTE OSINT SEARCH (${estimatedCost.toFixed(4)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
