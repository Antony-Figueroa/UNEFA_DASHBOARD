import type { GeoJSONVTInternalFeature, GeometryType, GeometryTypeMap } from "./definitions";
export type SupportedGeometries = GeoJSON.Point | GeoJSON.MultiPoint | GeoJSON.LineString | GeoJSON.MultiLineString | GeoJSON.Polygon | GeoJSON.MultiPolygon;
/**
 *
 * @param id - the feature's ID
 * @param type - the feature's type
 * @param geom - the feature's geometry
 * @param tags - the feature's properties
 * @returns the created feature
 */
export declare function createFeature<T extends GeometryType>(id: number | string | undefined, type: T, geom: GeometryTypeMap[T], tags: GeoJSON.GeoJsonProperties): GeoJSONVTInternalFeature;
//# sourceMappingURL=feature.d.ts.map