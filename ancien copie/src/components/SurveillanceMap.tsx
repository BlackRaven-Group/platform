import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X, RefreshCw, Database, Wifi } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadCameras, getCameraStats, type Camera } from '../lib/cameraApi';
import CameraStatusBar from './CameraStatusBar';
import { startAutomaticCleanup } from '../lib/cameraCache';
import { parseCsvFile, getPinColor, getPinIcon, type MapPin } from '../lib/csvParser';

interface SurveillanceMapProps {
  onBack?: () => void;
}

type CameraIconType = 'camera' | 'dome' | 'ptz' | 'alpr' | 'fixed' | 'guard';
type CameraContext = 'public' | 'private' | 'indoor' | 'fixme';

export default function SurveillanceMap({ onBack }: SurveillanceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [stats, setStats] = useState({ totalCameras: 0, successRate: 0 });
  const [pins, setPins] = useState<MapPin[]>([]);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const coverageLayer = useRef<L.LayerGroup | null>(null);
  const pinsLayer = useRef<L.LayerGroup | null>(null);
  const moveEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsKey = useRef<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
      loadStats();
      startAutomaticCleanup();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (moveEndTimeout.current) {
        clearTimeout(moveEndTimeout.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const loadStats = async () => {
    const cameraStats = await getCameraStats();
    setStats(cameraStats);
  };

  const initializeMap = () => {
    if (!mapContainer.current) {
      console.error('Map container not found');
      setError('Map container not found');
      return;
    }

    if (map.current) {
      return;
    }

    try {
      console.log('Initializing map...');

      map.current = L.map(mapContainer.current, {
        center: [48.8566, 2.3522],
        zoom: 15,
        minZoom: 13,
        zoomControl: false
      });

      // Detailed OpenStreetMap style with labels, POIs, transit
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      L.control.zoom({ position: 'bottomright' }).addTo(map.current);

      coverageLayer.current = L.layerGroup().addTo(map.current);
      markersLayer.current = L.layerGroup().addTo(map.current);
      pinsLayer.current = L.layerGroup().addTo(map.current);

      map.current.on('moveend', () => {
        if (moveEndTimeout.current) {
          clearTimeout(moveEndTimeout.current);
        }
        moveEndTimeout.current = setTimeout(() => {
          loadCamerasForView();
        }, 500);
      });

      // Re-render coverage zones on zoom change for proper scaling
      map.current.on('zoomend', () => {
        if (cameras.length > 0) {
          renderCameras(cameras);
        }
      });

      setTimeout(() => {
        map.current?.invalidateSize();
        loadCamerasForView();
        loadPins();
      }, 200);

      console.log('Map initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error initializing map: ' + err);
    }
  };

  const loadPins = async () => {
    try {
      const csvFiles = [
        '/src/data/Google map - Google map-4 -by MaxAI.csv',
        '/src/data/Google map - Google map-6 -by MaxAI copy.csv',
        '/src/data/Google map - Google map-7 -by MaxAI copy copy.csv',
        '/src/data/Google map - Google map-8 -by MaxAI copy.csv',
        '/src/data/Google map - Google map-9 -by MaxAI copy.csv',
        '/src/data/Google map - Google map-10 -by MaxAI copy.csv'
      ];

      const allPins: MapPin[] = [];

      for (const file of csvFiles) {
        const pins = await parseCsvFile(file);
        allPins.push(...pins);
      }

      console.log(`Loaded ${allPins.length} pins from ${csvFiles.length} CSV files`);
      setPins(allPins);
      renderPins(allPins);
    } catch (error) {
      console.error('Error loading pins:', error);
    }
  };

  const renderPins = (pinsToRender: MapPin[]) => {
    if (!map.current || !pinsLayer.current) return;

    pinsLayer.current.clearLayers();

    pinsToRender.forEach(pin => {
      const color = getPinColor(pin);
      const emoji = getPinIcon(pin);

      const icon = L.divIcon({
        html: `
          <div style="position: relative;">
            <div style="
              width: 24px;
              height: 24px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
            <div style="
              position: absolute;
              top: 4px;
              left: 4px;
              font-size: 12px;
              transform: rotate(45deg);
            ">${emoji}</div>
          </div>
        `,
        className: 'custom-pin-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      const marker = L.marker([pin.lat, pin.lng], { icon });

      let popupContent = `<div style="font-size: 12px; max-width: 200px;">`;
      popupContent += `<strong>${pin.title}</strong><br/>`;
      if (pin.agency) {
        popupContent += `<span style="color: ${color}; font-weight: bold;">${pin.agency}</span><br/>`;
      }
      popupContent += `<div style="margin-top: 4px; white-space: pre-wrap;">${pin.note}</div>`;
      popupContent += `</div>`;

      marker.bindPopup(popupContent);
      pinsLayer.current?.addLayer(marker);
    });
  };

  const loadCamerasForView = async () => {
    if (!map.current || loading) return;

    const zoom = map.current.getZoom();
    if (zoom < 13) {
      setError('Zoom in to view cameras (min zoom: 13)');
      return;
    }

    const bounds = map.current.getBounds();
    const boundsKey = `${bounds.getSouth().toFixed(4)},${bounds.getWest().toFixed(4)},${bounds.getNorth().toFixed(4)},${bounds.getEast().toFixed(4)}`;

    if (boundsKey === lastBoundsKey.current) {
      return;
    }

    lastBoundsKey.current = boundsKey;
    setLoading(true);
    setError(null);

    const apiResult = await loadCameras({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast()
    });

    if (apiResult.success && apiResult.data) {
      console.log(`Loaded ${apiResult.data.length} cameras${apiResult.cached ? ' (from cache)' : ''}`);
      setCameras(apiResult.data);
      setCached(apiResult.cached || false);
      setLastUpdate(new Date());
      renderCameras(apiResult.data);
      await loadStats();
    } else {
      setError(apiResult.error || 'Failed to load cameras');
      setCameras([]);
    }

    setLoading(false);
  };

  const handleRefresh = () => {
    lastBoundsKey.current = '';
    loadCamerasForView();
  };


  const getCameraIconType = (camera: Camera): CameraIconType => {
    const type = camera.surveillanceType?.toLowerCase() || '';
    if (type.includes('alpr') || type.includes('anpr')) return 'alpr';
    if (type.includes('dome')) return 'dome';
    if (type.includes('ptz') || type.includes('pan')) return 'ptz';
    if (type.includes('fixed')) return 'fixed';
    if (type.includes('guard')) return 'guard';
    return 'camera';
  };

  const getCameraContext = (camera: Camera): CameraContext => {
    if (camera.tags['fixme'] || camera.tags['check_date']) return 'fixme';
    if (camera.indoor) return 'indoor';
    const zone = camera.zone?.toLowerCase() || '';
    if (zone.includes('public') || zone === 'street' || zone === 'town') return 'public';
    if (zone.includes('private') || zone === 'parking' || zone === 'building') return 'private';
    return 'public';
  };

  const getContextColor = (context: CameraContext): string => {
    const colors = {
      public: '#ef4444',
      private: '#3b82f6',
      indoor: '#10b981',
      fixme: '#eab308'
    };
    return colors[context];
  };

  const getIconSVG = (iconType: CameraIconType, color: string) => {
    const icons: Record<CameraIconType, string> = {
      camera: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      fixed: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <rect x="-1" y="-6" width="2" height="3" fill="white" opacity="0.9"/>
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      ptz: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <rect x="-1" y="-6" width="2" height="4" fill="white" opacity="0.9"/>
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.9"/>
            <circle cx="0" cy="0" r="2" fill="${color}" opacity="0.4"/>
            <path d="M -6 0 Q -6 -2, -4.5 -2 l0.5 0" stroke="white" stroke-width="1" fill="none" opacity="0.7"/>
          </g>
        </svg>
      `,
      dome: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <ellipse cx="0" cy="2" rx="5" ry="1.5" fill="white" opacity="0.9"/>
            <path d="M -5 2 Q -5 -3, 0 -5 Q 5 -3, 5 2 Z" fill="white" opacity="0.85"/>
            <circle cx="0" cy="-1" r="2" fill="${color}" opacity="0.35"/>
          </g>
        </svg>
      `,
      guard: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <circle cx="0" cy="-2" r="2" fill="white" opacity="0.9"/>
            <path d="M -2 0 v4 h4 v-4z" fill="white" opacity="0.9"/>
            <rect x="-4" y="1" width="2" height="1.5" fill="white" opacity="0.9"/>
            <rect x="2" y="1" width="2" height="1.5" fill="white" opacity="0.9"/>
            <rect x="-1" y="4" width="1" height="2" fill="white" opacity="0.9"/>
            <rect x="0" y="4" width="1" height="2" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      alpr: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
            <rect x="-4" y="3" width="8" height="2.5" rx="0.5" fill="white" opacity="0.9" stroke="${color}" stroke-width="0.5"/>
            <text x="0" y="5.2" text-anchor="middle" font-size="1.8" font-weight="bold" font-family="monospace" fill="${color}">ABC</text>
          </g>
        </svg>
      `
    };
    return icons[iconType] || icons.camera;
  };

  const createCameraIcon = (camera: Camera) => {
    const iconType = getCameraIconType(camera);
    const context = getCameraContext(camera);
    const color = getContextColor(context);
    const uniqueId = Math.random().toString(36).substr(2, 9);

    const icons: Record<CameraIconType, string> = {
      camera: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      fixed: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <rect x="-1" y="-6" width="2" height="3" fill="white" opacity="0.9"/>
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      ptz: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <rect x="-1" y="-6" width="2" height="4" fill="white" opacity="0.9"/>
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.9"/>
            <circle cx="0" cy="0" r="2" fill="${color}" opacity="0.4"/>
            <path d="M -6 0 Q -6 -2, -4.5 -2 l0.5 0" stroke="white" stroke-width="1" fill="none" opacity="0.7"/>
          </g>
        </svg>
      `,
      dome: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <ellipse cx="0" cy="2" rx="5" ry="1.5" fill="white" opacity="0.9"/>
            <path d="M -5 2 Q -5 -3, 0 -5 Q 5 -3, 5 2 Z" fill="white" opacity="0.85"/>
            <circle cx="0" cy="-1" r="2" fill="${color}" opacity="0.35"/>
          </g>
        </svg>
      `,
      guard: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <circle cx="0" cy="-2" r="2" fill="white" opacity="0.9"/>
            <path d="M -2 0 v4 h4 v-4z" fill="white" opacity="0.9"/>
            <rect x="-4" y="1" width="2" height="1.5" fill="white" opacity="0.9"/>
            <rect x="2" y="1" width="2" height="1.5" fill="white" opacity="0.9"/>
            <rect x="-1" y="4" width="1" height="2" fill="white" opacity="0.9"/>
            <rect x="0" y="4" width="1" height="2" fill="white" opacity="0.9"/>
          </g>
        </svg>
      `,
      alpr: `
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
          <g transform="translate(14, 14)">
            <path d="M-4,-2 h6 v4 h-6z" fill="white" opacity="0.9"/>
            <path d="M2,-1.5 l3,-1 v5 l-3,-1z" fill="white" opacity="0.9"/>
            <rect x="-4" y="3" width="8" height="2.5" rx="0.5" fill="white" opacity="0.9" stroke="${color}" stroke-width="0.5"/>
            <text x="0" y="5.2" text-anchor="middle" font-size="1.8" font-weight="bold" font-family="monospace" fill="${color}">ABC</text>
          </g>
        </svg>
      `
    };

    const svg = icons[iconType] || icons.camera;

    return L.divIcon({
      html: svg,
      className: 'surveillance-camera-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const getCoverageRange = (camera: Camera, zoom?: number): number => {
    const currentZoom = zoom || map.current?.getZoom() || 15;

    // Base ranges in meters
    const cameraType = getCameraIconType(camera);
    let baseRange = 50;

    if (cameraType === 'dome') baseRange = 80;
    else if (cameraType === 'ptz') baseRange = 100;
    else if (cameraType === 'alpr') baseRange = 70;
    else if (cameraType === 'fixed') baseRange = 60;

    // Scale factor based on zoom (makes circles visually consistent)
    // At zoom 13: scale down, at zoom 19: scale up
    const zoomFactor = Math.pow(1.15, currentZoom - 15);

    return baseRange * zoomFactor;
  };

  const getFOV = (camera: Camera): number => {
    // Check for explicit angle tag first
    if (camera.tags['angle']) {
      const angle = parseInt(camera.tags['angle']);
      if (!isNaN(angle)) return angle;
    }
    if (camera.tags['camera:angle']) {
      const angle = parseInt(camera.tags['camera:angle']);
      if (!isNaN(angle)) return angle;
    }

    // Default FOV based on camera type
    const cameraType = getCameraIconType(camera);
    if (cameraType === 'dome') return 360;
    if (cameraType === 'ptz') return 90;
    if (cameraType === 'alpr') return 30;
    if (cameraType === 'fixed') return 60;
    return 70;
  };

  const createCoverageZone = (camera: Camera, zoom?: number) => {
    const context = getCameraContext(camera);
    const color = getContextColor(context);
    const currentZoom = zoom || map.current?.getZoom() || 15;
    const range = getCoverageRange(camera, currentZoom);
    const fov = getFOV(camera);
    const direction = camera.direction ?? camera.tags['camera:direction'] ? parseInt(camera.tags['camera:direction']) : undefined;
    const cameraType = getCameraIconType(camera);

    const latlng: [number, number] = [camera.lat, camera.lng];

    // Dome cameras = full circle
    if (cameraType === 'dome' || fov >= 360) {
      return L.circle(latlng, {
        radius: range,
        color: color,
        weight: 1.5,
        opacity: 0.5,
        fillColor: color,
        fillOpacity: 0.03
      });
    }

    // Directional cameras = sector/cone
    if (direction !== undefined) {
      const startAngle = direction - fov / 2;
      const endAngle = direction + fov / 2;
      const points: [number, number][] = [latlng];

      // Create arc
      for (let angle = startAngle; angle <= endAngle; angle += 3) {
        const rad = (angle * Math.PI) / 180;
        const dx = range * Math.sin(rad);
        const dy = range * Math.cos(rad);
        const lat = camera.lat + (dy / 111320);
        const lng = camera.lng + (dx / (111320 * Math.cos(camera.lat * Math.PI / 180)));
        points.push([lat, lng]);
      }
      points.push(latlng);

      return L.polygon(points, {
        color: color,
        weight: 1.5,
        opacity: 0.5,
        fillColor: color,
        fillOpacity: 0.04
      });
    }

    // No direction = smaller circle
    return L.circle(latlng, {
      radius: range * 0.8,
      color: color,
      weight: 1.5,
      opacity: 0.5,
      fillColor: color,
      fillOpacity: 0.03
    });
  };

  const renderCameras = (camerasToRender: Camera[]) => {
    if (!map.current || !markersLayer.current || !coverageLayer.current) return;

    markersLayer.current.clearLayers();
    coverageLayer.current.clearLayers();

    const zoom = map.current.getZoom();
    const shouldCluster = zoom < 16;

    if (shouldCluster) {
      const clusters = clusterCameras(camerasToRender, zoom);
      clusters.forEach(cluster => {
        if (cluster.count === 1 && cluster.cameras[0]) {
          const camera = cluster.cameras[0];

          // Add coverage zone with zoom level
          const coverageZone = createCoverageZone(camera, zoom);
          coverageLayer.current?.addLayer(coverageZone);

          const icon = createCameraIcon(camera);
          const marker = L.marker([camera.lat, camera.lng], { icon })
            .on('click', () => setSelectedCamera(camera));
          markersLayer.current?.addLayer(marker);
        } else {
          const clusterIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-10 h-10 bg-gray-900 border-2 border-gray-700 rounded-full text-white font-bold shadow-lg">
              ${cluster.count}
            </div>`,
            className: 'camera-cluster',
            iconSize: [40, 40]
          });
          const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon })
            .on('click', () => {
              map.current?.setView([cluster.lat, cluster.lng], Math.min(zoom + 2, 19));
            });
          markersLayer.current?.addLayer(marker);
        }
      });
    } else {
      camerasToRender.forEach(camera => {
        if (!camera.lat || !camera.lng || isNaN(camera.lat) || isNaN(camera.lng)) {
          return;
        }

        try {
          // Add coverage zone first (behind) with zoom level
          const coverageZone = createCoverageZone(camera, zoom);
          coverageLayer.current?.addLayer(coverageZone);

          const icon = createCameraIcon(camera);
          const marker = L.marker([camera.lat, camera.lng], { icon })
            .on('click', () => setSelectedCamera(camera));
          markersLayer.current?.addLayer(marker);
        } catch (err) {
          console.warn('Error rendering camera:', camera, err);
        }
      });
    }
  };

  const clusterCameras = (cameras: Camera[], zoom: number) => {
    const gridSize = zoom < 14 ? 0.02 : zoom < 15 ? 0.01 : 0.005;
    const grid = new Map<string, { lat: number; lng: number; cameras: Camera[]; count: number }>();

    cameras.forEach(camera => {
      const gridLat = Math.floor(camera.lat / gridSize) * gridSize;
      const gridLng = Math.floor(camera.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (!grid.has(key)) {
        grid.set(key, {
          lat: gridLat + gridSize / 2,
          lng: gridLng + gridSize / 2,
          cameras: [],
          count: 0
        });
      }

      const cluster = grid.get(key)!;
      cluster.cameras.push(camera);
      cluster.count++;
    });

    return Array.from(grid.values());
  };

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded border border-gray-700 shadow-sm transition-colors disabled:opacity-50"
          aria-label="Refresh cameras"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded border border-gray-700 shadow-sm transition-colors"
          aria-label="Toggle info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded border border-gray-700 shadow-sm transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {showInfo && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded border border-gray-200 shadow-sm w-full max-w-xs md:max-w-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Surveillance Map</h1>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close info"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-500">Cameras visible</div>
                  {cached ? (
                    <Database className="w-3 h-3 text-blue-500" title="From cache" />
                  ) : (
                    <Wifi className="w-3 h-3 text-white" title="Live data" />
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900">{cameras.length}</div>
                {lastUpdate && (
                  <div className="text-xs text-gray-400 mt-1">
                    {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Total in database</div>
                <div className="text-lg font-semibold text-gray-900">{stats.totalCameras.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.successRate}% success rate
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-gray-900 text-sm">Icons</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('camera', '#9ca3af') }} />
                  <span>Camera — no further information</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('fixed', '#9ca3af') }} />
                  <span>Fixed camera — limited area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('ptz', '#9ca3af') }} />
                  <span>Panning camera — various areas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('dome', '#9ca3af') }} />
                  <span>Dome camera — 360° area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('guard', '#9ca3af') }} />
                  <span>Guard — security service</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('alpr', '#9ca3af') }} />
                  <span>ALPR — Licence Plate Recognition</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <h3 className="font-medium mb-2 text-gray-900 text-sm">Colors</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('camera', '#ef4444') }} />
                  <span>Red — public outdoor area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('camera', '#3b82f6') }} />
                  <span>Blue — private outdoor area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('camera', '#10b981') }} />
                  <span>Green — indoor area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconSVG('camera', '#eab308') }} />
                  <span>Yellow — needs verification</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
              OpenStreetMap data • Updates on pan
            </div>
          </div>
        </div>
      )}

      {selectedCamera && (
        <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-4 md:left-4 md:right-auto z-[1000] bg-white rounded-t-lg md:rounded-lg shadow-lg border border-gray-200 w-full md:max-w-sm">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Camera Details</h3>
              <button
                onClick={() => setSelectedCamera(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono text-xs">{selectedCamera.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="capitalize">{getCameraIconType(selectedCamera)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Context:</span>
                <span className="capitalize">{getCameraContext(selectedCamera)}</span>
              </div>
              {selectedCamera.zone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Zone:</span>
                  <span className="capitalize">{selectedCamera.zone}</span>
                </div>
              )}
              {selectedCamera.direction !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Direction:</span>
                  <span>{selectedCamera.direction}°</span>
                </div>
              )}
            </div>
            <a
              href={`https://www.openstreetmap.org/edit?node=${selectedCamera.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center bg-gray-900 hover:bg-gray-800 text-white text-sm py-2 px-4 rounded transition-colors"
            >
              Edit on OSM
            </a>
          </div>
        </div>
      )}

      <CameraStatusBar
        visible={cameras.length}
        total={stats.totalCameras}
        cached={cached}
        loading={loading}
        error={error}
        successRate={stats.successRate}
        pinsCount={pins.length}
      />
    </div>
  );
}
