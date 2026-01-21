import { useEffect, useRef, useState } from 'react';
import { Search, ZoomIn, ZoomOut, Globe, X, ArrowLeft, MapPin, Layers, Upload, Settings } from 'lucide-react';
import { loadMapLocations, getCategoryStats, filterLocationsByCategory, searchLocations, type MapLocation } from '../lib/mapData';
import { loadMapPinsFromDatabase, getCategoryStats as getDbCategoryStats, ensureMapPinsTables, type MapPin as DbMapPin } from '../lib/mapPinsService';
import CsvUploader from './CsvUploader';
import CategoryManager from './CategoryManager';

interface GoogleMapProps {
  onBack?: () => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

export default function GoogleMap({ onBack }: GoogleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [allLocations, setAllLocations] = useState<MapLocation[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<MapLocation[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'terrain'>('satellite');
  const [tilt, setTilt] = useState(45);
  const [showUploader, setShowUploader] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [useDatabase, setUseDatabase] = useState(false);
  const [totalPinsCount, setTotalPinsCount] = useState(0);

  useEffect(() => {
    loadData();
    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (scriptLoaded && !loading && allLocations.length >= 0) {
      if (!map.current) {
        initializeMap();
      } else {
        updateMarkers();
      }
    }
  }, [scriptLoaded, loading, allLocations.length]);

  useEffect(() => {
    updateDisplayedLocations();
  }, [allLocations, selectedCategories, searchQuery]);

  useEffect(() => {
    if (map.current && displayedLocations.length >= 0) {
      updateMarkers();
    }
  }, [displayedLocations]);

  const loadGoogleMapsScript = () => {
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    window.initGoogleMap = () => {
      setScriptLoaded(true);
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAFF8jaSgdtVF85TQcMPnzlUJy5NtUs88g';

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  const loadData = async () => {
    setLoading(true);

    await ensureMapPinsTables();

    const dbPins = await loadMapPinsFromDatabase(undefined, undefined, undefined, 100);
    console.log('Database pins loaded:', dbPins.length);

    if (dbPins.length > 0) {
      setUseDatabase(true);
      setTotalPinsCount(dbPins.length);
      const mappedPins = dbPins.map(pin => ({
        id: pin.id,
        title: pin.title,
        note: pin.note,
        lat: pin.lat,
        lng: pin.lng,
        type: pin.type as any,
        agency: pin.agency,
        category: pin.category,
        color: '#64748b',
        icon: '📍'
      }));
      setAllLocations(mappedPins);
      const stats = await getDbCategoryStats();
      setCategoryStats(stats);
      setDisplayedLocations(mappedPins);
      console.log('Using database pins:', mappedPins.length);
    } else {
      setUseDatabase(false);
      console.log('Loading from CSV files...');
      const locations = await loadMapLocations();
      console.log('CSV locations loaded:', locations.length);
      setAllLocations(locations);
      setCategoryStats(getCategoryStats(locations));
      setDisplayedLocations(locations);
      setTotalPinsCount(locations.length);
      console.log('All locations set:', locations.length);
    }

    setLoading(false);
  };

  const initializeMap = () => {
    if (map.current || !mapContainer.current || !window.google?.maps) return;

    console.log('Initializing Google Map...');
    map.current = new window.google.maps.Map(mapContainer.current, {
      center: { lat: 20, lng: 0 },
      zoom: 3,
      mapTypeId: window.google.maps.MapTypeId.SATELLITE,
      tilt: 45,
      heading: 0,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['satellite', 'hybrid', 'terrain']
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP
      },
      zoomControl: false,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    console.log('Map initialized, updating markers with', displayedLocations.length, 'locations');
    updateMarkers();

    map.current.addListener('maptypeid_changed', () => {
      const currentType = map.current.getMapTypeId();
      if (currentType === 'satellite') setMapType('satellite');
      else if (currentType === 'hybrid') setMapType('hybrid');
      else if (currentType === 'terrain') setMapType('terrain');
    });
  };

  const updateDisplayedLocations = () => {
    let filtered = allLocations;

    if (selectedCategories.length > 0) {
      filtered = filterLocationsByCategory(filtered, selectedCategories);
    }

    if (searchQuery) {
      filtered = searchLocations(filtered, searchQuery);
    }

    setDisplayedLocations(filtered);
  };

  const updateMarkers = () => {
    if (!window.google?.maps) {
      console.log('Google Maps not loaded yet');
      return;
    }

    if (!map.current) {
      console.log('Map not initialized yet');
      return;
    }

    console.log('Updating markers with', displayedLocations.length, 'locations');
    
    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    if (displayedLocations.length === 0) {
      console.warn('No locations to display on map');
      return;
    }

    displayedLocations.forEach((location, index) => {
      if (isNaN(location.lat) || isNaN(location.lng)) {
        console.warn(`Invalid coordinates for location ${index}:`, location);
        return;
      }
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map.current,
        title: location.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: location.color,
          fillOpacity: 0.9,
          strokeColor: '#22c55e',
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP
      });

      marker.addListener('click', () => {
        setSelectedLocation(location);
        map.current.panTo({ lat: location.lat, lng: location.lng });
        map.current.setZoom(16);
        map.current.setTilt(tilt);
      });

      marker.addListener('mouseover', () => {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: location.color,
          fillOpacity: 1,
          strokeColor: '#22c55e',
          strokeWeight: 3,
        });
      });

      marker.addListener('mouseout', () => {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: location.color,
          fillOpacity: 0.9,
          strokeColor: '#22c55e',
          strokeWeight: 2,
        });
      });

      markers.current.push(marker);
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.setZoom(map.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.setZoom(map.current.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (map.current) {
      map.current.setCenter({ lat: 20, lng: 0 });
      map.current.setZoom(3);
      map.current.setTilt(45);
    }
  };

  const handleToggleTilt = () => {
    if (map.current) {
      const newTilt = tilt === 45 ? 0 : 45;
      setTilt(newTilt);
      map.current.setTilt(newTilt);
    }
  };

  const handleMapTypeChange = (type: 'satellite' | 'hybrid' | 'terrain') => {
    if (map.current) {
      setMapType(type);
      if (type === 'satellite') {
        map.current.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
      } else if (type === 'hybrid') {
        map.current.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
      } else {
        map.current.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
      }
    }
  };

  if (apiKeyError) {
    return (
      <div className="terminal-box flex items-center justify-center h-screen">
        <div className="text-red-500 text-center p-4">
          <div className="text-xl font-bold mb-2">⚠️ Erreur de configuration</div>
          <div className="text-sm">{apiKeyError}</div>
        </div>
      </div>
    );
  }

  if (loading || !scriptLoaded) {
    return (
      <div className="terminal-box flex items-center justify-center h-screen">
        <div className="text-white animate-pulse">LOADING GOOGLE MAPS...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 space-y-4 max-w-sm">
        <div className="terminal-box p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Globe className="w-6 h-6" />
              <span>MAP</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploader(true)}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Upload CSV"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Manage Categories"
              >
                <Settings className="w-5 h-5" />
              </button>
              {onBack && (
                <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-500 mb-4">
            {displayedLocations.length}/{useDatabase ? totalPinsCount : allLocations.length} pins
            {useDatabase && <span className="ml-2 text-green-600">(Database)</span>}
          </p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-black border-2 border-zinc-800 text-zinc-200 py-2 pl-10 pr-3 text-sm font-mono focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(categoryStats).map(([category, count]) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`terminal-button p-2 w-full flex items-center justify-between text-xs ${
                  selectedCategories.includes(category) ? 'bg-green-900/50' : ''
                }`}
              >
                <span>{category}</span>
                <span className="font-mono">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="terminal-box p-4 space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">CONTROLS</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleZoomIn} className="terminal-button p-2 text-xs flex items-center justify-center space-x-1">
              <ZoomIn className="w-3 h-3" />
              <span>ZOOM +</span>
            </button>
            <button onClick={handleZoomOut} className="terminal-button p-2 text-xs flex items-center justify-center space-x-1">
              <ZoomOut className="w-3 h-3" />
              <span>ZOOM -</span>
            </button>
          </div>

          <button onClick={handleResetView} className="terminal-button p-2 w-full text-xs flex items-center justify-center space-x-1">
            <Globe className="w-3 h-3" />
            <span>RESET VIEW</span>
          </button>

          <button onClick={handleToggleTilt} className="terminal-button p-2 w-full text-xs">
            TILT: {tilt}°
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => handleMapTypeChange('satellite')}
              className={`terminal-button p-2 flex-1 text-xs ${mapType === 'satellite' ? 'bg-green-900/50' : ''}`}
            >
              SAT
            </button>
            <button
              onClick={() => handleMapTypeChange('terrain')}
              className={`terminal-button p-2 flex-1 text-xs ${mapType === 'terrain' ? 'bg-green-900/50' : ''}`}
            >
              TER
            </button>
            <button
              onClick={() => handleMapTypeChange('hybrid')}
              className={`terminal-button p-2 flex-1 text-xs ${mapType === 'hybrid' ? 'bg-green-900/50' : ''}`}
            >
              HYB
            </button>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />

      {selectedLocation && (
        <div className="absolute top-4 right-4 z-10 terminal-box p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">{selectedLocation.title}</h3>
            </div>
            <button onClick={() => setSelectedLocation(null)} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-zinc-500">Category:</span>
              <span className="text-zinc-200 ml-2">{selectedLocation.category}</span>
            </div>

            {selectedLocation.note && (
              <div>
                <span className="text-zinc-500">Note:</span>
                <p className="text-zinc-200 mt-1 whitespace-pre-wrap">{selectedLocation.note}</p>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800">
              <span className="text-zinc-500">Coordinates:</span>
              <p className="text-zinc-200 font-mono mt-1">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>

            {selectedLocation.url && (
              <a
                href={selectedLocation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="terminal-button p-2 w-full text-xs flex items-center justify-center space-x-1 mt-3"
              >
                <span>OPEN IN GOOGLE MAPS</span>
              </a>
            )}
          </div>
        </div>
      )}

      {showUploader && (
        <CsvUploader
          onComplete={() => {
            setShowUploader(false);
            loadData();
          }}
          onClose={() => setShowUploader(false)}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onUpdate={() => loadData()}
        />
      )}
    </div>
  );
}
