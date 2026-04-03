import { type GeoJSONVTFeature, type GeoJSONVTFeatureNonPoint, type GeoJSONVTFeaturePoint, type GeoJSONVTTile } from './transform';
import { type GeoJSONVTInternalTile, type GeoJSONVTInternalTileFeature, type GeoJSONVTInternalTileFeaturePoint, type GeoJSONVTInternalTileFeaturNonPoint } from './tile';
import { type GeoJSONVTFeatureDiff, type GeoJSONVTSourceDiff } from './difference';
import type { GeoJSONVTInternalFeature, GeoJSONVTOptions, GeometryType, GeometryTypeMap, PartialGeoJSONVTFeature, StartEndSizeArray } from './definitions';
/**
 * Main class for creating and managing a vector tile index from GeoJSON data.
 */
declare class GeoJSONVT {
    private options;
    /** @internal */
    tiles: {
        [key: string]: GeoJSONVTInternalTile;
    };
    private tileCoords;
    /** @internal */
    stats: {
        [key: string]: number;
    };
    /** @internal */
    total: number;
    private source?;
    constructor(data: GeoJSON.GeoJSON, options: GeoJSONVTOptions);
    /**
     * splits features from a parent tile to sub-tiles.
     * z, x, and y are the coordinates of the parent tile
     * cz, cx, and cy are the coordinates of the target tile
     *
     * If no target tile is specified, splitting stops when we reach the maximum
     * zoom or the number of points is low as specified in the options.
     * @internal
     * @param features - features to split
     * @param z - tile zoom level
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @param cz - target tile zoom level
     * @param cx - target tile x coordinate
     * @param cy - target tile y coordinate
     */
    splitTile(features: GeoJSONVTInternalFeature[], z: number, x: number, y: number, cz?: number, cx?: number, cy?: number): void;
    /**
     * Given z, x, and y tile coordinates, returns the corresponding tile with geometries in tile coordinates, much like MVT data is stored.
     * @param z - tile zoom level
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @returns the transformed tile or null if not found
     */
    getTile(z: number | string, x: number | string, y: number | string): GeoJSONVTTile | null;
    /**
     * Invalidates (removes) tiles affected by the provided features
     * @internal
     * @param features
     */
    invalidateTiles(features: GeoJSONVTInternalFeature[]): void;
    /**
     * Updates the tile index by adding and/or removing geojson features
     * invalidates tiles that are affected by the update for regeneration on next getTile call.
     * @param diff - the source diff object
     */
    updateData(diff: GeoJSONVTSourceDiff): void;
}
export default function geojsonvt(data: GeoJSON.GeoJSON, options?: GeoJSONVTOptions): GeoJSONVT;
export type { GeoJSONVTInternalFeature, GeoJSONVTOptions, GeoJSONVTInternalTile, GeoJSONVTInternalTileFeature, GeometryType, PartialGeoJSONVTFeature, GeoJSONVT, GeometryTypeMap, StartEndSizeArray, GeoJSONVTTile, GeoJSONVTFeature, GeoJSONVTSourceDiff, GeoJSONVTFeatureDiff, GeoJSONVTFeaturePoint, GeoJSONVTFeatureNonPoint, GeoJSONVTInternalTileFeaturePoint, GeoJSONVTInternalTileFeaturNonPoint };
//# sourceMappingURL=index.d.ts.map