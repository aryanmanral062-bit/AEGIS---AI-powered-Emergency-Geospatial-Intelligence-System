import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import 'leaflet/dist/leaflet.css';
import {
  hazardZonesGeoJSON,
} from '../../data/gis/hazardsData';
import {
  habitationsGeoJSON,
} from '../../data/gis/habitationsData';
import {
  sheltersGeoJSON,
} from '../../data/gis/sheltersData';
import {
  roadsGeoJSON,
} from '../../data/gis/roadsData';
import {
  movementVectorsV1GeoJSON,
  movementVectorsInvalidatedGeoJSON,
  movementVectorsV2GeoJSON,
  bridgeBreachIncidentGeoJSON,
} from '../../data/gis/movementVectorsData';

// Geographically calibrated Wayanad coordinates (Lat, Lng for Leaflet)
const WAYANAD_CENTER: [number, number] = [11.545, 76.115]; // Mundakkai-Meppadi corridor
const INITIAL_ZOOM = 12;
const WAYANAD_BOUNDS = L.latLngBounds(
  [11.490, 76.020], // Southwest
  [11.620, 76.170]  // Northeast
);

export type BasemapMode = 'operational' | 'satellite' | 'terrain';

interface GISMapProps {
  routeR104Status?: 'clear' | 'at-risk' | 'blocked';
  activeVectorType?: 'none' | 'plan-v1-vectors' | 'plan-v1-invalidated-vector' | 'plan-v2-vectors';
}

interface LayerVisibility {
  hazardZones: boolean;
  habitations: boolean;
  shelters: boolean;
  roads: boolean;
  movementVectors: boolean;
}

interface SpatialFocusInfo {
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
}

export default function GISMap({
  routeR104Status = 'at-risk',
  activeVectorType = 'none',
}: GISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups to manage dynamic toggling without full re-renders
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hazardLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const habitationsLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const sheltersLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const roadsLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const vectorsLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const breachLayerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());

  const [basemapMode, setBasemapMode] = useState<BasemapMode>('operational');
  const [layers, setLayers] = useState<LayerVisibility>({
    hazardZones: true,
    habitations: true,
    shelters: true,
    roads: true,
    movementVectors: true,
  });

  const [spatialFocus, setSpatialFocus] = useState<SpatialFocusInfo>({
    title: 'Wayanad (Mundakkai Corridor)',
    subtitle: 'Route R104',
    status: routeR104Status.toUpperCase(),
    statusColor: routeR104Status === 'blocked' ? '#991b1b' : routeR104Status === 'at-risk' ? '#c2410c' : '#15803d',
  });

  // Sync spatial focus with routeR104Status prop
  useEffect(() => {
    setSpatialFocus((prev) => ({
      ...prev,
      subtitle: 'Route R104',
      status: routeR104Status.toUpperCase(),
      statusColor: routeR104Status === 'blocked' ? '#991b1b' : routeR104Status === 'at-risk' ? '#c2410c' : '#15803d',
    }));
  }, [routeR104Status]);

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleResetFocus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(WAYANAD_BOUNDS, {
        padding: [30, 30],
        maxZoom: 14,
        animate: true,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 1. TILE LAYER MANAGEMENT (Zero API Key, 100% Reliable OpenStreetMap / Free)
  // ---------------------------------------------------------------------------
  const getTileUrl = (mode: BasemapMode) => {
    switch (mode) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'operational':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = (mode: BasemapMode) => {
    switch (mode) {
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain':
        return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      case 'operational':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | KSDMA GIS';
    }
  };

  // Switch basemap tiles without touching any operational layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(getTileUrl(basemapMode), {
      attribution: getTileAttribution(basemapMode),
      maxZoom: basemapMode === 'terrain' ? 17 : 19,
      subdomains: basemapMode === 'satellite' ? [] : ['a', 'b', 'c'],
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [basemapMode]);

  // ---------------------------------------------------------------------------
  // 2. LAYER SYNC FUNCTIONS (Re-populates Leaflet GeoJSON layer groups)
  // ---------------------------------------------------------------------------

  // Render Hazard Polygons
  const updateHazardLayers = useCallback(() => {
    const group = hazardLayerGroupRef.current;
    group.clearLayers();

    const geoJsonLayer = L.geoJSON(hazardZonesGeoJSON, {
      style: (feature) => {
        const severity = feature?.properties?.severity;
        switch (severity) {
          case 'critical':
            return {
              color: '#991b1b',
              weight: 2.5,
              opacity: 0.95,
              fillColor: '#dc2626',
              fillOpacity: 0.38,
            };
          case 'high':
            return {
              color: '#c2410c',
              weight: 2.2,
              opacity: 0.9,
              fillColor: '#ea580c',
              fillOpacity: 0.32,
            };
          case 'moderate':
            return {
              color: '#a16207',
              weight: 2.0,
              opacity: 0.85,
              fillColor: '#ca8a04',
              fillOpacity: 0.28,
            };
          case 'low':
          default:
            return {
              color: '#1d4ed8',
              weight: 1.8,
              opacity: 0.8,
              fillColor: '#2563eb',
              fillOpacity: 0.22,
            };
        }
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        const color = p.severity === 'critical' ? '#991b1b' : p.severity === 'high' ? '#c2410c' : '#a16207';
        
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;min-width:220px;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:${color};text-transform:uppercase;margin-bottom:2px;">
              HAZARD SUSCEPTIBILITY ZONE
            </div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="margin-bottom:4px;font-size:11px;">
              <span style="color:#64748b;">Risk Level:</span> <strong style="color:${color};">${p.risk}</strong>
            </div>
            <div style="margin-bottom:6px;font-size:10.5px;color:#334155;background:#f8fafc;padding:5px 7px;border-radius:4px;border:1px solid #e2e8f0;">
              <strong>Causal Factors:</strong> ${p.drivers}
            </div>
            <div style="font-size:9.5px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;">
              Source: ${p.source}
            </div>
          </div>
        `);

        layer.on('click', () => {
          setSpatialFocus({
            title: p.name,
            subtitle: 'Hazard Polygon',
            status: `${p.risk} RISK`,
            statusColor: color,
          });
        });
      },
    });

    group.addLayer(geoJsonLayer);
  }, []);

  // Render Habitation Markers
  const updateHabitationLayers = useCallback(() => {
    const group = habitationsLayerGroupRef.current;
    group.clearLayers();

    const geoJsonLayer = L.geoJSON(habitationsGeoJSON, {
      pointToLayer: (feature: Feature, latlng: L.LatLng) => {
        const p = feature.properties;
        const households = p?.households ?? 100;
        const radius = households > 300 ? 12 : households > 150 ? 10 : 8;
        const color = p?.risk === 'critical' ? '#b91c1c' : p?.risk === 'high' ? '#c2410c' : '#a16207';

        // Custom HTML Marker with pulse effect
        const customIcon = L.divIcon({
          className: 'aegis-habitation-marker',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${radius * 2}px;height:${radius * 2}px;">
              <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:${color};opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:${radius * 1.5}px;height:${radius * 1.5}px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.35);"></div>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        return L.marker(latlng, { icon: customIcon });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;min-width:210px;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#b91c1c;text-transform:uppercase;margin-bottom:2px;">
              VULNERABLE HABITATION
            </div>
            <div style="font-size:13.5px;font-weight:800;color:#0f172a;margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Households:</span> <strong>${p.households}</strong>
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Exposed Population:</span> <strong>${p.population} persons</strong>
            </div>
            <div style="font-size:11px;margin-bottom:4px;">
              <span style="color:#64748b;">Priority Action:</span> <strong style="color:#991b1b;">${p.priority}</strong>
            </div>
            <div style="font-size:9.5px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;">
              Terrain: ${p.terrain}
            </div>
          </div>
        `);

        // Add persistent label
        layer.bindTooltip(`<strong>${p.name}</strong> (${p.population}p)`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'aegis-map-label',
        });

        layer.on('click', () => {
          setSpatialFocus({
            title: p.name,
            subtitle: 'Habitation Zone',
            status: `${p.exposure} EXPOSURE`,
            statusColor: p.risk === 'critical' ? '#b91c1c' : '#c2410c',
          });
        });
      },
    });

    group.addLayer(geoJsonLayer);
  }, []);

  // Render Relief Shelters
  const updateShelterLayers = useCallback(() => {
    const group = sheltersLayerGroupRef.current;
    group.clearLayers();

    const geoJsonLayer = L.geoJSON(sheltersGeoJSON, {
      pointToLayer: (_feature, latlng) => {
        const customIcon = L.divIcon({
          className: 'aegis-shelter-marker',
          html: `
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#15803d;border:2.5px solid #ffffff;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.4);color:#ffffff;font-size:11px;font-weight:900;">
              ⌂
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        return L.marker(latlng, { icon: customIcon });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;min-width:230px;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#15803d;text-transform:uppercase;margin-bottom:2px;">
              DESIGNATED RELIEF SHELTER
            </div>
            <div style="font-size:13.5px;font-weight:800;color:#0f172a;margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#f0fdf4;padding:6px;border-radius:4px;border:1px solid #bbf7d0;margin-bottom:6px;">
              <div><span style="color:#166534;font-size:10px;">Total Capacity:</span><br/><strong>${p.capacity} beds</strong></div>
              <div><span style="color:#166534;font-size:10px;">Available:</span><br/><strong style="color:#15803d;">${p.remainingCapacity} beds</strong></div>
            </div>
            <div style="font-size:10.5px;margin-bottom:3px;">
              <span style="color:#64748b;">Route Link:</span> <strong>${p.routeViability}</strong>
            </div>
            <div style="font-size:10px;color:#475569;border-top:1px solid #e2e8f0;padding-top:4px;">
              ${p.medicalAvailability}
            </div>
          </div>
        `);

        layer.bindTooltip(`<strong>SHELTER:</strong> ${p.name}`, {
          permanent: true,
          direction: 'bottom',
          offset: [0, 12],
          className: 'aegis-shelter-label',
        });

        layer.on('click', () => {
          setSpatialFocus({
            title: p.name,
            subtitle: 'Relief Facility',
            status: `${p.remainingCapacity} BEDS AVAILABLE`,
            statusColor: '#15803d',
          });
        });
      },
    });

    group.addLayer(geoJsonLayer);
  }, []);

  // Render Road Corridors (with dynamic R104 blocked/at-risk states)
  const updateRoadLayers = useCallback(() => {
    const group = roadsLayerGroupRef.current;
    group.clearLayers();

    const geoJsonLayer = L.geoJSON(roadsGeoJSON, {
      style: (feature) => {
        const isR104 = feature?.properties?.isR104;
        if (isR104) {
          if (routeR104Status === 'blocked') {
            return {
              color: '#991b1b',
              weight: 5,
              opacity: 0.95,
              dashArray: '6, 8',
            };
          }
          if (routeR104Status === 'at-risk') {
            return {
              color: '#c2410c',
              weight: 4.2,
              opacity: 0.9,
              dashArray: '8, 6',
            };
          }
          return {
            color: '#0f294a',
            weight: 3.5,
            opacity: 0.9,
          };
        }
        return {
          color: '#0f294a',
          weight: 3.5,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        const isR104 = p.isR104;
        const statusText = isR104 ? routeR104Status.toUpperCase() : p.status;
        const color = statusText === 'BLOCKED' ? '#991b1b' : statusText === 'AT-RISK' || statusText === 'AT RISK' ? '#c2410c' : '#15803d';

        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;min-width:230px;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#64748b;text-transform:uppercase;margin-bottom:2px;">
              EVACUATION CORRIDOR
            </div>
            <div style="font-size:13px;font-weight:800;color:${color};margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="margin-bottom:3px;font-size:11px;">
              <span style="color:#64748b;">Current Status:</span> <strong style="color:${color};">${statusText}</strong>
            </div>
            <div style="margin-bottom:3px;font-size:11px;">
              <span style="color:#64748b;">Dependent Population:</span> <strong>${p.affectedPopulation}</strong>
            </div>
            <div style="font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;display:flex;justify-content:space-between;">
              <span>Verified: ${p.lastVerification}</span>
              <span>${p.source}</span>
            </div>
          </div>
        `);

        layer.on('click', () => {
          setSpatialFocus({
            title: p.name,
            subtitle: 'Evacuation Corridor',
            status: statusText,
            statusColor: color,
          });
        });
      },
    });

    group.addLayer(geoJsonLayer);
  }, [routeR104Status]);

  // Render Movement Transit Vectors (Simulation S4/S5/S7/S9/S10)
  const updateMovementVectorLayers = useCallback(() => {
    const group = vectorsLayerGroupRef.current;
    group.clearLayers();

    let activeData: FeatureCollection | null = null;
    if (activeVectorType === 'plan-v1-vectors') activeData = movementVectorsV1GeoJSON;
    else if (activeVectorType === 'plan-v1-invalidated-vector') activeData = movementVectorsInvalidatedGeoJSON;
    else if (activeVectorType === 'plan-v2-vectors') activeData = movementVectorsV2GeoJSON;

    if (!activeData || activeData.features.length === 0) return;

    const geoJsonLayer = L.geoJSON(activeData, {
      style: (feature) => {
        const color = feature?.properties?.color || '#15803d';
        const isSevered = activeVectorType === 'plan-v1-invalidated-vector';
        return {
          color: color,
          weight: isSevered ? 5 : 4,
          opacity: 0.95,
          dashArray: isSevered ? '4, 6' : '6, 6',
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:${p.color};text-transform:uppercase;margin-bottom:2px;">
              ${p.plan} TRANSIT VECTOR
            </div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Evacuees:</span> <strong>${p.evacuees} persons</strong>
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Target Destination:</span> <strong>${p.destination}</strong>
            </div>
            <div style="font-size:11px;color:${p.color};font-weight:bold;margin-top:4px;">
              Status: ${p.status}
            </div>
          </div>
        `);
      },
    });

    group.addLayer(geoJsonLayer);
  }, [activeVectorType]);

  // Render S6 Bridge Breach Failure Point
  const updateBreachIncidentLayer = useCallback(() => {
    const group = breachLayerGroupRef.current;
    group.clearLayers();

    if (routeR104Status !== 'blocked') return;

    const geoJsonLayer = L.geoJSON(bridgeBreachIncidentGeoJSON, {
      pointToLayer: (_feature, latlng) => {
        const customIcon = L.divIcon({
          className: 'aegis-breach-marker',
          html: `
            <div style="display:flex;align-items:center;justify-content:center;background:#991b1b;color:#ffffff;border:2.5px solid #ffffff;border-radius:50%;width:28px;height:28px;box-shadow:0 0 12px rgba(220,38,38,0.9);font-weight:900;font-size:13px;animation:bounce 1s infinite;">
              ⚠
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        return L.marker(latlng, { icon: customIcon });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        if (!p) return;
        layer.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#0f172a;line-height:1.45;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:0.05em;color:#991b1b;text-transform:uppercase;margin-bottom:2px;">
              CRITICAL INFRASTRUCTURE FAILURE
            </div>
            <div style="font-size:13px;font-weight:800;color:#991b1b;margin-bottom:4px;">
              ${p.name}
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Condition:</span> <strong style="color:#991b1b;">${p.status}</strong>
            </div>
            <div style="font-size:11px;margin-bottom:2px;">
              <span style="color:#64748b;">Impact:</span> <strong>${p.impact}</strong>
            </div>
          </div>
        `);

        layer.bindTooltip(`<strong>⚠ R104 BRIDGE BREACH (KM 4.2)</strong>`, {
          permanent: true,
          direction: 'top',
          offset: [0, -14],
          className: 'aegis-breach-label',
        });
      },
    });

    group.addLayer(geoJsonLayer);
  }, [routeR104Status]);

  // ---------------------------------------------------------------------------
  // 3. MAIN LEAFLET MAP INITIALIZATION & LIFECYCLE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map instance
    const map = L.map(mapContainerRef.current, {
      center: WAYANAD_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false, // We add custom position zoom control below
      attributionControl: true,
    });

    // Add controls in clean positions
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Add layer groups to map
    hazardLayerGroupRef.current.addTo(map);
    roadsLayerGroupRef.current.addTo(map);
    vectorsLayerGroupRef.current.addTo(map);
    breachLayerGroupRef.current.addTo(map);
    habitationsLayerGroupRef.current.addTo(map);
    sheltersLayerGroupRef.current.addTo(map);

    // Initial population of layers
    updateHazardLayers();
    updateHabitationLayers();
    updateShelterLayers();
    updateRoadLayers();
    updateMovementVectorLayers();
    updateBreachIncidentLayer();

    // Initial fit bounds to Wayanad corridor
    map.fitBounds(WAYANAD_BOUNDS, { padding: [20, 20] });

    mapInstanceRef.current = map;

    // ResizeObserver to handle container flex layout and panel collapse resizes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [
    updateHazardLayers,
    updateHabitationLayers,
    updateShelterLayers,
    updateRoadLayers,
    updateMovementVectorLayers,
    updateBreachIncidentLayer,
  ]);

  // Update dynamic layers when props change
  useEffect(() => {
    updateRoadLayers();
    updateBreachIncidentLayer();
  }, [routeR104Status, updateRoadLayers, updateBreachIncidentLayer]);

  useEffect(() => {
    updateMovementVectorLayers();
  }, [activeVectorType, updateMovementVectorLayers]);

  // Sync Checkbox Toggles with Layer Groups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layers.hazardZones) {
      if (!map.hasLayer(hazardLayerGroupRef.current)) map.addLayer(hazardLayerGroupRef.current);
    } else {
      if (map.hasLayer(hazardLayerGroupRef.current)) map.removeLayer(hazardLayerGroupRef.current);
    }

    if (layers.habitations) {
      if (!map.hasLayer(habitationsLayerGroupRef.current)) map.addLayer(habitationsLayerGroupRef.current);
    } else {
      if (map.hasLayer(habitationsLayerGroupRef.current)) map.removeLayer(habitationsLayerGroupRef.current);
    }

    if (layers.shelters) {
      if (!map.hasLayer(sheltersLayerGroupRef.current)) map.addLayer(sheltersLayerGroupRef.current);
    } else {
      if (map.hasLayer(sheltersLayerGroupRef.current)) map.removeLayer(sheltersLayerGroupRef.current);
    }

    if (layers.roads) {
      if (!map.hasLayer(roadsLayerGroupRef.current)) map.addLayer(roadsLayerGroupRef.current);
    } else {
      if (map.hasLayer(roadsLayerGroupRef.current)) map.removeLayer(roadsLayerGroupRef.current);
    }

    if (layers.movementVectors) {
      if (!map.hasLayer(vectorsLayerGroupRef.current)) map.addLayer(vectorsLayerGroupRef.current);
      if (!map.hasLayer(breachLayerGroupRef.current)) map.addLayer(breachLayerGroupRef.current);
    } else {
      if (map.hasLayer(vectorsLayerGroupRef.current)) map.removeLayer(vectorsLayerGroupRef.current);
      if (map.hasLayer(breachLayerGroupRef.current)) map.removeLayer(breachLayerGroupRef.current);
    }
  }, [layers]);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-100 flex flex-col overflow-hidden">
      {/* Real Interactive Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Embedded CSS for clean tooltips & labels */}
      <style>{`
        .aegis-map-label {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .aegis-shelter-label {
          background: rgba(240, 253, 244, 0.95);
          border: 1px solid #86efac;
          color: #14532d;
          font-family: Inter, sans-serif;
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .aegis-breach-label {
          background: rgba(254, 242, 242, 0.96);
          border: 1px solid #f87171;
          color: #991b1b;
          font-family: Inter, sans-serif;
          font-size: 9.5px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(153, 27, 27, 0.25);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          padding: 2px;
        }
        .leaflet-popup-content {
          margin: 8px 10px;
        }
      `}</style>

      {/* 1. GIS Layers Control Panel (Top-Left) */}
      <div className="absolute top-2.5 left-2.5 bg-white/95 border border-slate-300 rounded p-2 shadow-xs text-xs z-[400] min-w-[170px] backdrop-blur-xs">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span>GIS Layers</span>
          <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono-code">OSM</span>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.hazardZones}
              onChange={() => toggleLayer('hazardZones')}
              className="accent-navy-800 cursor-pointer"
            />
            <span>Hazard Zones</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.habitations}
              onChange={() => toggleLayer('habitations')}
              className="accent-navy-800 cursor-pointer"
            />
            <span>Habitations</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.shelters}
              onChange={() => toggleLayer('shelters')}
              className="accent-navy-800 cursor-pointer"
            />
            <span>Relief Shelters</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.roads}
              onChange={() => toggleLayer('roads')}
              className="accent-navy-800 cursor-pointer"
            />
            <span>Road Network</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950 text-[11px]">
            <input
              type="checkbox"
              checked={layers.movementVectors}
              onChange={() => toggleLayer('movementVectors')}
              className="accent-navy-800 cursor-pointer"
            />
            <span>Movement Vectors</span>
          </label>
        </div>
      </div>

      {/* 2. Basemap Mode Switcher Control (Top-Center-Right) */}
      <div className="absolute top-2.5 right-40 z-[400] bg-white/95 border border-slate-300 rounded shadow-xs p-0.5 flex items-center gap-0.5 text-xs backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setBasemapMode('operational')}
          className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
            basemapMode === 'operational'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="OpenStreetMap Standard (Roads, Settlements & Corridor Focus)"
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
          title="ESRI World Imagery (High-Resolution Physical Satellite)"
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
          title="OpenTopoMap (Topographic Shaded Contours & Elevation Relief)"
        >
          TERRAIN
        </button>
      </div>

      {/* 3. Map Reset & Spatial Focus Button (Top-Right) */}
      <div className="absolute top-2.5 right-12 z-[400]">
        <button
          type="button"
          onClick={handleResetFocus}
          className="px-2.5 py-1 text-[11px] font-bold bg-white/95 border border-slate-300 rounded shadow-xs text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          title="Reset map view to Wayanad focus area"
        >
          <span>⌖</span> Focus Wayanad
        </button>
      </div>

      {/* 4. Movement Vector Overlay Status Banner (Top Center) */}
      {activeVectorType !== 'none' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-300 rounded px-3 py-1 shadow-sm text-xs font-bold z-[400] flex items-center gap-2 backdrop-blur-xs">
          {activeVectorType === 'plan-v1-vectors' && (
            <span className="text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Plan V1 Active Transit Corridors (Meppadi, Kalpetta, Vythiri)
            </span>
          )}
          {activeVectorType === 'plan-v1-invalidated-vector' && (
            <span className="text-red-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              ⚠ Route R104 Transit Severed — 150 Evacuee Corridor Invalidated
            </span>
          )}
          {activeVectorType === 'plan-v2-vectors' && (
            <span className="text-blue-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Plan V2 Resilient Corridors Active (Kalpetta Arterial & Vythiri Bypass)
            </span>
          )}
        </div>
      )}

      {/* 5. Operational Map Legend (Bottom-Left) */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/95 border border-slate-300 rounded p-2 shadow-xs text-xs z-[400] max-w-[280px] backdrop-blur-xs">
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
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-800 shrink-0 border border-white text-[7px] text-white flex items-center justify-center font-bold">⌂</span>
            <span>Relief Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-navy-800 shrink-0"></span>
            <span>Clear Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-dashed border-orange-600 shrink-0"></span>
            <span>At-Risk (R104)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 border-b-2 border-dashed border-red-800 shrink-0"></span>
            <span>Blocked (R104)</span>
          </div>
        </div>
      </div>

      {/* 6. Spatial Focus Card (Bottom-Right) */}
      <div className="absolute bottom-2.5 right-2.5 bg-white/95 border border-slate-300 rounded px-2.5 py-1.5 shadow-xs text-right z-[400] backdrop-blur-xs min-w-[190px]">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Spatial Focus</div>
        <div className="text-[11.5px] font-extrabold text-slate-900 leading-tight">{spatialFocus.title}</div>
        <div className="text-[9.5px] text-slate-600 font-mono-code flex items-center justify-end gap-1 mt-0.5">
          <span>{spatialFocus.subtitle}:</span>
          <strong style={{ color: spatialFocus.statusColor }}>{spatialFocus.status}</strong>
        </div>
      </div>
    </div>
  );
}
