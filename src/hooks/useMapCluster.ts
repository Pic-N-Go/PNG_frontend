import { useMemo, useCallback } from 'react';
import Supercluster from 'supercluster';

export interface MapClusterBounds {
  southWestLat: number;
  southWestLng: number;
  northEastLat: number;
  northEastLng: number;
}

export interface UseMapClusterOptions {
  radius?: number;
  maxZoom?: number;
  minPoints?: number;
}

export interface ClusterPoint {
  isCluster: true;
  id: number;
  latitude: number;
  longitude: number;
  count: number;
  expansionZoom: number;
}

export interface LeafPoint<T> {
  isCluster: false;
  spot: T;
  latitude: number;
  longitude: number;
}

export type MapClusterElement<T> = ClusterPoint | LeafPoint<T>;

export function useMapCluster<T extends { id: string | number; lat: number; lng: number }>(
  spots: T[],
  zoom: number,
  bounds: MapClusterBounds | null,
  options?: UseMapClusterOptions
) {
  const radius = options?.radius ?? 45;
  const maxZoom = options?.maxZoom ?? 15;
  const minPoints = options?.minPoints ?? 2;

  const points = useMemo<Supercluster.PointFeature<{ spot: T; spotId: string }>[]>(() => {
    return spots
      .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number' && !isNaN(s.lat) && !isNaN(s.lng))
      .map((spot) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false as const,
          spotId: String(spot.id),
          spot,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [spot.lng, spot.lat],
        },
      }));
  }, [spots]);

  const index = useMemo(() => {
    const sc = new Supercluster<{ spot: T; spotId: string }>({
      radius,
      maxZoom,
      minPoints,
    });
    sc.load(points as any);
    return sc;
  }, [points, radius, maxZoom, minPoints]);

  const clusterElements = useMemo<MapClusterElement<T>[]>(() => {
    if (!spots || spots.length === 0) return [];

    let bbox: [number, number, number, number] = [-180, -85, 180, 85];
    if (bounds) {
      const latMargin = Math.max(0.01, (bounds.northEastLat - bounds.southWestLat) * 0.25);
      const lngMargin = Math.max(0.01, (bounds.northEastLng - bounds.southWestLng) * 0.25);
      bbox = [
        Math.max(-180, bounds.southWestLng - lngMargin),
        Math.max(-85, bounds.southWestLat - latMargin),
        Math.min(180, bounds.northEastLng + lngMargin),
        Math.min(85, bounds.northEastLat + latMargin),
      ];
    }

    const currentZoom = Math.max(0, Math.round(zoom));

    try {
      const results = index.getClusters(bbox, currentZoom);

      return results.map((item) => {
        const [lng, lat] = item.geometry.coordinates;
        if ('point_count' in item.properties || (item.properties as any).cluster) {
          const clusterId = item.id as number;
          const expansionZoom = Math.min(20, index.getClusterExpansionZoom(clusterId));
          return {
            isCluster: true,
            id: clusterId,
            latitude: lat,
            longitude: lng,
            count: (item.properties as any).point_count ?? 1,
            expansionZoom,
          };
        }
        return {
          isCluster: false,
          spot: (item.properties as any).spot as T,
          latitude: lat,
          longitude: lng,
        };
      });
    } catch (e) {
      console.warn('[useMapCluster] Error calculating clusters:', e);
      return spots.map((spot) => ({
        isCluster: false,
        spot,
        latitude: spot.lat,
        longitude: spot.lng,
      }));
    }
  }, [spots, bounds, zoom, index]);

  const getClusterExpansionZoom = useCallback(
    (clusterId: number) => {
      try {
        return Math.min(20, index.getClusterExpansionZoom(clusterId));
      } catch {
        return Math.min(20, Math.floor(zoom) + 2);
      }
    },
    [index, zoom]
  );

  return {
    clusterElements,
    getClusterExpansionZoom,
  };
}
