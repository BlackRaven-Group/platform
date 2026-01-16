export interface SurveillanceCamera {
  id: string;
  lat: number;
  lng: number;
  type: string;
  surveillanceType?: string;
  indoor?: boolean;
  tags: Record<string, string>;
}

export type CameraIconType = 'camera' | 'dome' | 'ptz' | 'alpr' | 'fixed' | 'guard';
export type CameraContext = 'public' | 'private' | 'indoor' | 'fixme';

export interface CameraDisplay {
  camera: SurveillanceCamera;
  iconType: CameraIconType;
  context: CameraContext;
  color: string;
}

export function getCameraIconType(camera: SurveillanceCamera): CameraIconType {
  const type = camera.surveillanceType?.toLowerCase() || '';

  if (type.includes('alpr') || type.includes('anpr')) return 'alpr';
  if (type.includes('dome')) return 'dome';
  if (type.includes('ptz') || type.includes('pan')) return 'ptz';
  if (type.includes('fixed')) return 'fixed';
  if (type.includes('guard')) return 'guard';

  return 'camera';
}

export function getCameraContext(camera: SurveillanceCamera): CameraContext {
  if (camera.tags['fixme'] || camera.tags['check_date']) return 'fixme';
  if (camera.indoor) return 'indoor';

  const zone = camera.tags['surveillance:zone']?.toLowerCase() || '';
  if (zone.includes('public') || zone === 'street' || zone === 'town') return 'public';
  if (zone.includes('private') || zone === 'parking' || zone === 'building') return 'private';

  return 'public';
}

export function getContextColor(context: CameraContext): string {
  const colors: Record<CameraContext, string> = {
    public: '#ef4444',
    private: '#3b82f6',
    indoor: '#10b981',
    fixme: '#eab308'
  };
  return colors[context];
}

export function buildOverpassQuery(bounds: { south: number; west: number; north: number; east: number }): string {
  const { south, west, north, east } = bounds;

  return `
    [out:json][timeout:25];
    (
      node["man_made"="surveillance"](${south},${west},${north},${east});
      node["surveillance"](${south},${west},${north},${east});
    );
    out body;
  `.trim();
}

export async function fetchSurveillanceCameras(bounds: { south: number; west: number; north: number; east: number }): Promise<SurveillanceCamera[]> {
  const query = buildOverpassQuery(bounds);
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    return data.elements.map((element: any) => ({
      id: `cam-${element.id}`,
      lat: element.lat,
      lng: element.lon,
      type: 'surveillance',
      surveillanceType: element.tags?.['surveillance:type'] || 'camera',
      indoor: element.tags?.['indoor'] === 'yes',
      tags: element.tags || {}
    }));
  } catch (error) {
    console.error('Error fetching surveillance cameras:', error);
    return [];
  }
}

export function getCameraDisplayInfo(camera: SurveillanceCamera): CameraDisplay {
  const iconType = getCameraIconType(camera);
  const context = getCameraContext(camera);
  const color = getContextColor(context);

  return { camera, iconType, context, color };
}

export function getIconSVG(iconType: CameraIconType, color: string): string {
  const icons: Record<CameraIconType, string> = {
    camera: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M7 10 L17 10 L17 16 L7 16 Z M17 13 L20 11 L20 15 Z" fill="white"/>
      </svg>
    `,
    dome: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M12 8 A5 5 0 0 1 12 16 A5 5 0 0 1 12 8" fill="white"/>
        <circle cx="12" cy="12" r="2" fill="${color}"/>
      </svg>
    `,
    ptz: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M8 10 L16 10 L16 14 L8 14 Z M16 12 L19 10 L19 14 Z M12 10 L12 7 M10 7 L14 7" stroke="white" stroke-width="1.5"/>
      </svg>
    `,
    alpr: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="7" y="9" width="10" height="6" rx="1" fill="white"/>
        <text x="12" y="13" text-anchor="middle" font-size="5" font-weight="bold" fill="${color}">ABC</text>
      </svg>
    `,
    fixed: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M7 11 L17 11 L17 15 L7 15 Z M17 13 L19 11.5 L19 14.5 Z" fill="white"/>
      </svg>
    `,
    guard: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="10" r="2" fill="white"/>
        <path d="M12 12 L12 16 M9 14 L15 14 M10 16 L10 18 M14 16 L14 18" stroke="white" stroke-width="1.5"/>
      </svg>
    `
  };

  return icons[iconType] || icons.camera;
}
