import type { GeoJSONVTInternalFeature, GeoJSONVTOptions } from "./definitions";
export type GeoJSONVTInternalTileFeaturePoint = {
    id?: number | string | undefined;
    type: 1;
    tags: GeoJSON.GeoJsonProperties | null;
    geometry: number[];
};
export type GeoJSONVTInternalTileFeaturNonPoint = {
    id?: number | string | undefined;
    type: 2 | 3;
    tags: GeoJSON.GeoJsonProperties | null;
    geometry: number[][];
};
export type GeoJSONVTInternalTileFeature = GeoJSONVTInternalTileFeaturePoint | GeoJSONVTInternalTileFeaturNonPoint;
export type GeoJSONVTInternalTile = {
    features: GeoJSONVTInternalTileFeature[];
    numPoints: number;
    numSimplified: number;
    numFeatures: number;
    x: number;
    y: number;
    z: number;
    transformed: boolean;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    source: GeoJSONVTInternalFeature[] | null;
};
/**
 * Creates a tile object from the given features
 * @param features - the features to include in the tile
 * @param z
 * @param tx
 * @param ty
 * @param options - the options object
 * @returns the created tile
 */
export declare function createTile(features: GeoJSONVTInternalFeature[], z: number, tx: number, ty: number, options: GeoJSONVTOptions): GeoJSONVTInternalTile;
//# sourceMappingURL=tile.d.ts.map