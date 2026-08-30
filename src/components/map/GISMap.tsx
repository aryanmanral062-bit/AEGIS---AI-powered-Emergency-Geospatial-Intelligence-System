import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ENTITY_IDS } from '../../data/simulationData';

// Geographically calibrated Wayanad coordinates
const WAYANAD_CENTER: [number, number] = [76.09, 11.56];
const INITIAL_ZOOM = 11.5;

export type BasemapMode = 'operational' | 'satellite' | 'terrain';

interface GISMapProps {
  routeR104Status?: 'clear' | 'at-risk' | 'blocked';
  activeVectorType?: 'none' | 'plan-v1-vectors' | 'plan-v1-invalidated-vector' | 'plan-v2-vectors';
}

// 1. Hazard Zones Dataset
const hazardZones: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'hz-mundakkai',
        name: 'Mundakkai Landslide Susceptibility Zone',
        risk: 'CRITICAL',
        severity: 'critical',
        drivers: 'Steep hill slope saturation (94.2%) · 24h Rainfall accumulation >204mm · Debris flow corridor',
        source: 'GSI Hazard Atlas / IMD Doppler Telemetry',
        status: 'DEMO / SIMULATION DATA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.120, 11.545], [76.155, 11.550], [76.160, 11.520],
          [76.140, 11.510], [76.115, 11.520], [76.120, 11.545],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hz-chooralmala',
        name: 'Chooralmala High Slope Zone',
        risk: 'HIGH',
        severity: 'high',
        drivers: 'Slope instability · Proximity to hill stream · Soil moisture threshold breach',
        source: 'KSDMA Spatial Registry / IMD',
        status: 'DEMO / SIMULATION DATA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.095, 11.535], [76.120, 11.545], [76.125, 11.515],
          [76.090, 11.510], [76.095, 11.535],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hz-meppadi',
        name: 'Meppadi Lowland Flood Buffer',
        risk: 'WARNING',
        severity: 'warning',
        drivers: 'River level at warning threshold · Surface runoff accumulation basin',
        source: 'CWC Hydrological Model',
        status: 'DEMO / SIMULATION DATA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.115, 11.565], [76.145, 11.570], [76.150, 11.545],
          [76.120, 11.545], [76.115, 11.565],
        ]],
      },
    },
  ],
};

// 2. Vulnerable Habitations Dataset
const habitations: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.MUNDAKKAI,
        name: 'Mundakkai',
        households: 427,
        population: 1495,
        exposure: 'CRITICAL',
        risk: 'critical',
      },
      geometry: { type: 'Point', coordinates: [76.138, 11.535] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.CHOORALMALA,
        name: 'Chooralmala',
        households: 312,
        population: 1090,
        exposure: 'HIGH',
        risk: 'high',
      },
      geometry: { type: 'Point', coordinates: [76.110, 11.525] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.ATTAMALA,
        name: 'Attamala',
        households: 156,
        population: 546,
        exposure: 'WARNING',
        risk: 'warning',
      },
      geometry: { type: 'Point', coordinates: [76.148, 11.518] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.HABITATIONS.MEPPADI,
        name: 'Meppadi Town Habitation',
        households: 89,
        population: 312,
        exposure: 'MODERATE',
        risk: 'warning',
      },
      geometry: { type: 'Point', coordinates: [76.126, 11.554] },
    },
  ],
};

// 3. Relief Shelters Dataset
const shelters: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.MEPPADI_HSS,
        name: 'Meppadi Govt. HSS',
        type: 'Government School',
        capacity: 800,
        occupancy: 45,
        remainingCapacity: 755,
        routeViability: 'Route R104 dependency',
        medicalAvailability: 'Primary Health Desk On-site',
      },
      geometry: { type: 'Point', coordinates: [76.128, 11.556] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.KALPETTA_HALL,
        name: 'Kalpetta Community Hall',
        type: 'Community Hall',
        capacity: 650,
        occupancy: 22,
        remainingCapacity: 628,
        routeViability: 'Route R212 (Clear ✓)',
        medicalAvailability: 'District Hospital Linkage (1.5 km)',
      },
      geometry: { type: 'Point', coordinates: [76.083, 11.608] },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.SHELTERS.ST_MARYS,
        name: "St. Mary's School Vythiri",
        type: 'Aided School',
        capacity: 500,
        occupancy: 0,
        remainingCapacity: 500,
        routeViability: 'Route R318 (Clear ✓)',
        medicalAvailability: 'Standby Medical Officer Assigned',
      },
      geometry: { type: 'Point', coordinates: [76.042, 11.551] },
    },
  ],
};

// 4. Evacuation Routes Dataset
const routes: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R104,
        name: 'Route R104 (Mundakkai-Meppadi)',
        status: 'AT RISK',
        affectedPopulation: '150 households / 525 persons',
        lastVerification: '2h 17m ago (Stale)',
        source: 'Field Officer (Vythiri)',
        isR104: true,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.138, 11.535], [76.125, 11.530], [76.110, 11.525],
          [76.118, 11.540], [76.128, 11.556]
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R212,
        name: 'Route R212 (Meppadi-Kalpetta Arterial)',
        status: 'CLEAR',
        affectedPopulation: '0',
        lastVerification: '25 min ago',
        source: 'PWD Roads Division',
        isR104: false,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.128, 11.556], [76.115, 11.570], [76.100, 11.585],
          [76.090, 11.598], [76.083, 11.608]
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: ENTITY_IDS.ROUTES.R318,
        name: 'Route R318 (Chooralmala-Vythiri Bypass)',
        status: 'CLEAR',
        affectedPopulation: '0',
        lastVerification: '40 min ago',
        source: 'Taluk Revenue Squad',
        isR104: false,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.110, 11.525], [76.085, 11.535], [76.065, 11.542],
          [76.042, 11.551]
        ],
      },
    },
  ],
};

// 5. Movement Vectors by Plan Version
const movementVectorsV1: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-meppadi',
        name: 'Plan V1 Corridor: Mundakkai → Meppadi HSS (612 evacuees)',
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.128, 11.556]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-kalpetta',
        name: 'Plan V1 Corridor: Mundakkai → Kalpetta Hall (503 evacuees)',
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.115, 11.570], [76.083, 11.608]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v1-vythiri',
        name: "Plan V1 Corridor: Mundakkai → St. Mary's Vythiri (380 evacuees)",
        color: '#15803d',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.085, 11.535], [76.042, 11.551]],
      },
    },
  ],
};

const movementVectorsInvalidated: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-inv-r104',
        name: 'SEVERED CORRIDOR: R104 Failure (150 evacuees blocked)',
        color: '#b91c1c',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.125, 11.530]],
      },
    },
  ],
};

const movementVectorsV2: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-kalpetta',
        name: 'Plan V2 PRIMARY: Mundakkai → Kalpetta Hall (612 evacuees via R212)',
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.110, 11.525], [76.115, 11.570], [76.083, 11.608]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-vythiri',
        name: "Plan V2 SECONDARY: Mundakkai → St. Mary's Vythiri (503 evacuees via R318)",
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.138, 11.535], [76.085, 11.535], [76.042, 11.551]],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'vec-v2-meppadi',
        name: 'Plan V2 LOCAL: Meppadi HSS (380 evacuees local bypass)',
        color: '#1d4ed8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [[76.126, 11.554], [76.128, 11.556]],
      },
    },
  ],
};

// 6. Breach Incident Point (S6 Bridge Failure)
const breachIncidentPoint: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'breach-point-km42',
        name: 'R104 CULVERT BREACH (KM 4.2)',
        status: 'IMPASSABLE',
      },
      geometry: {
        type: 'Point',
        coordinates: [76.125, 11.530],
      },
    },
  ],
};

const emptyFeatureCollection: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

interface LayerVisibility {
  hazardZones: boolean;
  habitations: boolean;
  shelters: boolean;
  roads: boolean;
  movementVectors: boolean;
}

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || 'dZNg3PV7atbgQYnGmPIl';

const OPERATIONAL_TILES = MAPTILER_KEY
  ? [`https://api.maptiler.com/maps/dataviz/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`]
  : [
      'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
    ];

const SATELLITE_TILES = MAPTILER_KEY
  ? [`https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`]
  : ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];

const TERRAIN_TILES = MAPTILER_KEY
  ? [`https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`]
  : ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'];

export default function GISMap({
  routeR104Status = 'at-risk',
  activeVectorType = 'none',
}: GISMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [basemapMode, setBasemapMode] = useState<BasemapMode>('operational');
  const [layers, setLayers] = useState<LayerVisibility>({
    hazardZones: true,
    habitations: true,
    shelters: true,
    roads: true,
    movementVectors: true,
  });

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleResetFocus = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: WAYANAD_CENTER,
        zoom: INITIAL_ZOOM,
        essential: true,
      });
    }
  };

  // Helper to determine active vector GeoJSON
  const getActiveVectorData = (type: GISMapProps['activeVectorType']): FeatureCollection => {
    if (type === 'plan-v1-vectors') return movementVectorsV1;
    if (type === 'plan-v1-invalidated-vector') return movementVectorsInvalidated;
    if (type === 'plan-v2-vectors') return movementVectorsV2;
    return emptyFeatureCollection;
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      localIdeographFontFamily: 'sans-serif',
      style: {
        version: 8,
        name: 'AEGIS Control Room Multi-Basemap Style',
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'basemap-operational-src': {
            type: 'raster',
            tiles: OPERATIONAL_TILES,
            tileSize: 256,
            attribution: '&copy; MapTiler &copy; OpenStreetMap contributors | KSDMA GIS',
          },
          'basemap-satellite-src': {
            type: 'raster',
            tiles: SATELLITE_TILES,
            tileSize: 256,
            attribution: '&copy; MapTiler &copy; OpenStreetMap contributors | KSDMA GIS',
          },
          'basemap-terrain-src': {
            type: 'raster',
            tiles: TERRAIN_TILES,
            tileSize: 256,
            attribution: '&copy; MapTiler &copy; OpenStreetMap contributors | KSDMA GIS',
          },
        },
        layers: [
          {
            id: 'basemap-operational-layer',
            type: 'raster',
            source: 'basemap-operational-src',
            layout: { visibility: 'visible' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'basemap-satellite-layer',
            type: 'raster',
            source: 'basemap-satellite-src',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'basemap-terrain-layer',
            type: 'raster',
            source: 'basemap-terrain-src',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: WAYANAD_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: 16,
      minZoom: 8,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 160, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      // -------------------------------------------------------------
      // 1. HAZARD ZONES (Polygons + Outlines + Labels)
      // -------------------------------------------------------------
      if (!map.getSource('hazard-zones-src')) {
        map.addSource('hazard-zones-src', { type: 'geojson', data: hazardZones });
      }
      if (!map.getLayer('hazard-zones-fill')) {
        map.addLayer({
          id: 'hazard-zones-fill',
          type: 'fill',
          source: 'hazard-zones-src',
          paint: {
            'fill-color': [
              'match', ['get', 'severity'],
              'critical', 'rgba(185, 28, 28, 0.35)',
              'high', 'rgba(194, 65, 12, 0.28)',
              'rgba(161, 98, 7, 0.22)',
            ],
          },
        });
      }
      if (!map.getLayer('hazard-zones-line')) {
        map.addLayer({
          id: 'hazard-zones-line',
          type: 'line',
          source: 'hazard-zones-src',
          paint: {
            'line-color': [
              'match', ['get', 'severity'],
              'critical', '#991b1b',
              'high', '#c2410c',
              '#a16207',
            ],
            'line-width': 2.4,
          },
        });
      }

      // -------------------------------------------------------------
      // 2. EVACUATION ROUTES (R104, R212, R318)
      // -------------------------------------------------------------
      if (!map.getSource('routes-src')) {
        map.addSource('routes-src', { type: 'geojson', data: routes });
      }
      if (!map.getLayer('routes-line')) {
        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes-src',
          paint: {
            'line-color': [
              'case',
              ['get', 'isR104'],
              routeR104Status === 'blocked' ? '#991b1b' : routeR104Status === 'at-risk' ? '#c2410c' : '#0f294a',
              '#0f294a',
            ],
            'line-width': [
              'case',
              ['get', 'isR104'],
              routeR104Status === 'blocked' ? 4.5 : routeR104Status === 'at-risk' ? 3.8 : 3.0,
              3.0,
            ],
          },
        });
      }

      // -------------------------------------------------------------
      // 3. MOVEMENT VECTORS (Simulation S5, S6/S7, S9/S10)
      // -------------------------------------------------------------
      if (!map.getSource('movement-vectors-src')) {
        map.addSource('movement-vectors-src', {
          type: 'geojson',
          data: getActiveVectorData(activeVectorType),
        });
      }
      if (!map.getLayer('movement-vectors-line')) {
        map.addLayer({
          id: 'movement-vectors-line',
          type: 'line',
          source: 'movement-vectors-src',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#15803d'],
            'line-width': 3.6,
          },
        });
      }

      // -------------------------------------------------------------
      // 4. S6 BREACH INCIDENT MARKER (KM 4.2 Bridge Culvert Collapse)
      // -------------------------------------------------------------
      if (!map.getSource('breach-incident-src')) {
        map.addSource('breach-incident-src', {
          type: 'geojson',
          data: breachIncidentPoint,
        });
      }
      if (!map.getLayer('breach-incident-circle')) {
        map.addLayer({
          id: 'breach-incident-circle',
          type: 'circle',
          source: 'breach-incident-src',
          layout: {
            visibility: routeR104Status === 'blocked' ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': 12,
            'circle-color': '#dc2626',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
          },
        });
      }
      if (!map.getLayer('breach-incident-label')) {
        map.addLayer({
          id: 'breach-incident-label',
          type: 'symbol',
          source: 'breach-incident-src',
          layout: {
            visibility: routeR104Status === 'blocked' ? 'visible' : 'none',
            'text-field': '⚠ R104 BRIDGE BREACH (KM 4.2)',
            'text-size': 10.5,
            'text-offset': [0, -1.8],
          },
          paint: {
            'text-color': '#991b1b',
            'text-halo-color': '#ffffff',
            'text-halo-width': 3,
          },
        });
      }

      // -------------------------------------------------------------
      // 5. VULNERABLE HABITATIONS (Mundakkai, Chooralmala, Attamala, Meppadi)
      // -------------------------------------------------------------
      if (!map.getSource('habitations-src')) {
        map.addSource('habitations-src', { type: 'geojson', data: habitations });
      }
      if (!map.getLayer('habitations-circle')) {
        map.addLayer({
          id: 'habitations-circle',
          type: 'circle',
          source: 'habitations-src',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['get', 'households'],
              80, 8,
              200, 11,
              400, 14,
            ],
            'circle-color': [
              'match', ['get', 'risk'],
              'critical', '#b91c1c',
              'high', '#c2410c',
              '#a16207',
            ],
            'circle-opacity': 0.95,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2.5,
          },
        });
      }
      if (!map.getLayer('habitations-label')) {
        map.addLayer({
          id: 'habitations-label',
          type: 'symbol',
          source: 'habitations-src',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, -1.7],
          },
          paint: {
            'text-color': '#0f172a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2.5,
          },
        });
      }

      // -------------------------------------------------------------
      // 6. RELIEF SHELTERS (Meppadi HSS, Kalpetta Hall, St. Mary's Vythiri)
      // -------------------------------------------------------------
      if (!map.getSource('shelters-src')) {
        map.addSource('shelters-src', { type: 'geojson', data: shelters });
      }
      if (!map.getLayer('shelters-circle')) {
        map.addLayer({
          id: 'shelters-circle',
          type: 'circle',
          source: 'shelters-src',
          paint: {
            'circle-radius': 11,
            'circle-color': '#166534',
            'circle-opacity': 0.95,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2.5,
          },
        });
      }
      if (!map.getLayer('shelters-label')) {
        map.addLayer({
          id: 'shelters-label',
          type: 'symbol',
          source: 'shelters-src',
          layout: {
            'text-field': ['concat', 'SHELTER: ', ['get', 'name']],
            'text-size': 10,
            'text-offset': [0, 1.8],
          },
          paint: {
            'text-color': '#14532d',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2.5,
          },
        });
      }

      // -------------------------------------------------------------
      // 7. INTERACTIVE CLICK POPUPS & HOVER STATES
      // -------------------------------------------------------------
      map.on('click', 'routes-line', (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const isR104 = p?.isR104;
        const statusText = isR104 ? routeR104Status.toUpperCase() : (p?.status ?? 'CLEAR');
        const color = statusText === 'BLOCKED' ? '#991b1b' : statusText === 'AT-RISK' || statusText === 'AT RISK' ? '#c2410c' : '#166534';

        new maplibregl.Popup({ closeButton: true, maxWidth: '270px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.4;">
              <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#64748b;text-transform:uppercase;margin-bottom:2px;">
                EVACUATION CORRIDOR
              </div>
              <div style="font-size:13px;font-weight:800;color:${color};margin-bottom:4px;">
                ${p?.name ?? 'Route'}
              </div>
              <div style="margin-bottom:4px;font-size:11px;">
                <span style="color:#64748b;">Current Status:</span> <strong style="color:${color};">${statusText}</strong>
              </div>
              <div style="margin-bottom:4px;font-size:11px;">
                <span style="color:#64748b;">Dependent Population:</span> <strong>${p?.affectedPopulation ?? '0'}</strong>
              </div>
              <div style="font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;display:flex;justify-content:space-between;">
                <span>Verified: ${p?.lastVerification ?? 'Just now'}</span>
                <span>${p?.source ?? 'Field Squad'}</span>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('click', 'habitations-circle', (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.4;">
              <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#b91c1c;text-transform:uppercase;margin-bottom:2px;">
                HABITATION DEMOGRAPHICS
              </div>
              <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">
                ${p?.name}
              </div>
              <div style="font-size:11px;margin-bottom:2px;">
                <span style="color:#64748b;">Households:</span> <strong>${p?.households}</strong>
              </div>
              <div style="font-size:11px;margin-bottom:2px;">
                <span style="color:#64748b;">Population Exposed:</span> <strong>${p?.population} persons</strong>
              </div>
              <div style="font-size:11px;margin-top:4px;color:#b91c1c;font-weight:bold;">
                Exposure Category: ${p?.exposure}
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('click', 'shelters-circle', (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.4;">
              <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#166534;text-transform:uppercase;margin-bottom:2px;">
                DESIGNATED RELIEF SHELTER
              </div>
              <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">
                ${p?.name}
              </div>
              <div style="font-size:11px;margin-bottom:2px;">
                <span style="color:#64748b;">Usable Bed Capacity:</span> <strong>${p?.capacity} beds</strong>
              </div>
              <div style="font-size:11px;margin-bottom:2px;">
                <span style="color:#64748b;">Route Viability:</span> <strong>${p?.routeViability}</strong>
              </div>
              <div style="font-size:10px;color:#64748b;margin-top:4px;border-top:1px solid #e2e8f0;padding-top:2px;">
                ${p?.medicalAvailability}
              </div>
            </div>
          `)
          .addTo(map);
      });

      const interactiveLayers = ['hazard-zones-fill', 'habitations-circle', 'shelters-circle', 'routes-line', 'breach-incident-circle'];
      for (const layer of interactiveLayers) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
    });

    mapRef.current = map;

    // Attach ResizeObserver to automatically resize map canvas when layout splits change
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainer.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Visibility on Mode Switch (Zero style reload, zero overlay loss)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('basemap-operational-layer')) {
      map.setLayoutProperty('basemap-operational-layer', 'visibility', basemapMode === 'operational' ? 'visible' : 'none');
    }
    if (map.getLayer('basemap-satellite-layer')) {
      map.setLayoutProperty('basemap-satellite-layer', 'visibility', basemapMode === 'satellite' ? 'visible' : 'none');
    }
    if (map.getLayer('basemap-terrain-layer')) {
      map.setLayoutProperty('basemap-terrain-layer', 'visibility', basemapMode === 'terrain' ? 'visible' : 'none');
    }
  }, [basemapMode]);

  // Update Route R104 Color & Breach Marker Dynamically on State Change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('routes-line')) {
      map.setPaintProperty('routes-line', 'line-color', [
        'case',
        ['get', 'isR104'],
        routeR104Status === 'blocked' ? '#991b1b' : routeR104Status === 'at-risk' ? '#c2410c' : '#0f294a',
        '#0f294a',
      ]);

      map.setPaintProperty('routes-line', 'line-width', [
        'case',
        ['get', 'isR104'],
        routeR104Status === 'blocked' ? 4.5 : routeR104Status === 'at-risk' ? 3.8 : 3.0,
        3.0,
      ]);
    }

    if (map.getLayer('breach-incident-circle')) {
      map.setLayoutProperty('breach-incident-circle', 'visibility', routeR104Status === 'blocked' ? 'visible' : 'none');
    }
    if (map.getLayer('breach-incident-label')) {
      map.setLayoutProperty('breach-incident-label', 'visibility', routeR104Status === 'blocked' ? 'visible' : 'none');
    }
  }, [routeR104Status]);

  // Update Movement Vector Data Dynamically when Simulation State changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const vectorSrc = map.getSource('movement-vectors-src') as maplibregl.GeoJSONSource | undefined;
    if (vectorSrc) {
      vectorSrc.setData(getActiveVectorData(activeVectorType));
    }
  }, [activeVectorType]);

  // Sync Layer Visibility Checkboxes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('hazard-zones-fill')) {
      map.setLayoutProperty('hazard-zones-fill', 'visibility', layers.hazardZones ? 'visible' : 'none');
      map.setLayoutProperty('hazard-zones-line', 'visibility', layers.hazardZones ? 'visible' : 'none');
    }
    if (map.getLayer('habitations-circle')) {
      map.setLayoutProperty('habitations-circle', 'visibility', layers.habitations ? 'visible' : 'none');
      map.setLayoutProperty('habitations-label', 'visibility', layers.habitations ? 'visible' : 'none');
    }
    if (map.getLayer('shelters-circle')) {
      map.setLayoutProperty('shelters-circle', 'visibility', layers.shelters ? 'visible' : 'none');
      map.setLayoutProperty('shelters-label', 'visibility', layers.shelters ? 'visible' : 'none');
    }
    if (map.getLayer('routes-line')) {
      map.setLayoutProperty('routes-line', 'visibility', layers.roads ? 'visible' : 'none');
    }
    if (map.getLayer('movement-vectors-line')) {
      map.setLayoutProperty('movement-vectors-line', 'visibility', layers.movementVectors ? 'visible' : 'none');
    }
  }, [layers]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-100 flex flex-col">
      <div ref={mapContainer} className="w-full h-full flex-1" />

      {/* Layer Control Panel (Top-Left) */}
      <div className="absolute top-2.5 left-2.5 bg-white/95 border border-slate-300 rounded p-2 shadow-xs text-xs z-10 min-w-[170px]">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          GIS Layers
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.hazardZones}
              onChange={() => toggleLayer('hazardZones')}
              className="accent-navy-800"
            />
            <span>Hazard Zones</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.habitations}
              onChange={() => toggleLayer('habitations')}
              className="accent-navy-800"
            />
            <span>Habitations</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.shelters}
              onChange={() => toggleLayer('shelters')}
              className="accent-navy-800"
            />
            <span>Relief Shelters</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.roads}
              onChange={() => toggleLayer('roads')}
              className="accent-navy-800"
            />
            <span>Road Network</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.movementVectors}
              onChange={() => toggleLayer('movementVectors')}
              className="accent-navy-800"
            />
            <span>Movement Vectors</span>
          </label>
        </div>
      </div>

      {/* Basemap Mode Switcher Control (Top-Center-Right) */}
      <div className="absolute top-2.5 right-38 z-10 bg-white/95 border border-slate-300 rounded shadow-xs p-0.5 flex items-center gap-0.5 text-xs">
        <button
          type="button"
          onClick={() => setBasemapMode('operational')}
          className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
            basemapMode === 'operational'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Clean Operational Basemap (Roads, Settlements & Corridor Focus)"
        >
          OPERATIONAL
        </button>
        <button
          type="button"
          onClick={() => setBasemapMode('satellite')}
          className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
            basemapMode === 'satellite'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="High-Resolution Satellite Imagery (Physical Terrain & Slope Detail)"
        >
          SATELLITE
        </button>
        <button
          type="button"
          onClick={() => setBasemapMode('terrain')}
          className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
            basemapMode === 'terrain'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Topographic Shaded Relief (Valleys, Elevations & Contours)"
        >
          TERRAIN
        </button>
      </div>

      {/* Map Reset & Spatial Focus Button (Top-Right) */}
      <div className="absolute top-2.5 right-12 z-10">
        <button
          type="button"
          onClick={handleResetFocus}
          className="px-2.5 py-1 text-[11px] font-bold bg-white/95 border border-slate-300 rounded shadow-xs text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          title="Reset map view to Wayanad focus area"
        >
          <span>⌖</span> Focus Wayanad
        </button>
      </div>

      {/* Movement Vector Overlay Status Banner (Top Center) */}
      {activeVectorType !== 'none' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-300 rounded px-3 py-1 shadow-sm text-xs font-bold z-10 flex items-center gap-2">
          {activeVectorType === 'plan-v1-vectors' && (
            <span className="text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Plan V1 Active Transit Corridors (Meppadi, Kalpetta, Vythiri)
            </span>
          )}
          {activeVectorType === 'plan-v1-invalidated-vector' && (
            <span className="text-red-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              ⚠ Route R104 Transit Severed — 150 Evacuee Corridor Invalidated
            </span>
          )}
          {activeVectorType === 'plan-v2-vectors' && (
            <span className="text-blue-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Plan V2 Resilient Corridors Active (Kalpetta Arterial & Vythiri Bypass)
            </span>
          )}
        </div>
      )}

      {/* Operational Map Legend (Bottom-Left) */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/95 border border-slate-300 rounded p-2 shadow-xs text-xs z-10 max-w-[280px]">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
          <span>Operational Symbology</span>
          <span className="text-[8.5px] font-mono-code text-slate-400 uppercase">{basemapMode}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 text-[10px] text-slate-800 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-700/40 border border-red-700 shrink-0"></span>
            <span>Critical Hazard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-700 shrink-0 border border-white"></span>
            <span>Habitation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-800 shrink-0 border border-white"></span>
            <span>Relief Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-navy-800 shrink-0"></span>
            <span>Clear Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-orange-600 shrink-0"></span>
            <span>At-Risk (R104)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-red-800 shrink-0"></span>
            <span>Blocked (R104)</span>
          </div>
        </div>
      </div>

      {/* Spatial Focus Tag (Bottom-Right) */}
      <div className="absolute bottom-2.5 right-2.5 bg-white/95 border border-slate-300 rounded px-2 py-1 shadow-xs text-right z-10">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Spatial Focus</div>
        <div className="text-[11.5px] font-extrabold text-slate-900 leading-tight">Wayanad (Mundakkai Corridor)</div>
        <div className="text-[9.5px] text-slate-500 font-mono-code">
          R104 Status: <strong className={routeR104Status === 'blocked' ? 'text-red-700' : routeR104Status === 'at-risk' ? 'text-orange-700' : 'text-emerald-700'}>{routeR104Status.toUpperCase()}</strong>
        </div>
      </div>
    </div>
  );
}
