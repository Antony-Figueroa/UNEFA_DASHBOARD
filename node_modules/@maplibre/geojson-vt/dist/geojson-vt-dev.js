(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.geojsonvt = factory());
})(this, (function () { 'use strict';

/**
 * calculate simplification data using optimized Douglas-Peucker algorithm
 * @param coords - flat array of coordinates
 * @param first - index of the first coordinate in the segment
 * @param last - index of the last coordinate in the segment
 * @param sqTolerance - square tolerance value
 */
function simplify(coords, first, last, sqTolerance) {
    let maxSqDist = sqTolerance;
    const mid = first + ((last - first) >> 1);
    let minPosToMid = last - first;
    let index;
    const ax = coords[first];
    const ay = coords[first + 1];
    const bx = coords[last];
    const by = coords[last + 1];
    for (let i = first + 3; i < last; i += 3) {
        const d = getSqSegDist(coords[i], coords[i + 1], ax, ay, bx, by);
        if (d > maxSqDist) {
            index = i;
            maxSqDist = d;
            continue;
        }
        if (d === maxSqDist) {
            // a workaround to ensure we choose a pivot close to the middle of the list,
            // reducing recursion depth, for certain degenerate inputs
            // https://github.com/mapbox/geojson-vt/issues/104
            const posToMid = Math.abs(i - mid);
            if (posToMid < minPosToMid) {
                index = i;
                minPosToMid = posToMid;
            }
        }
    }
    if (maxSqDist > sqTolerance) {
        if (index - first > 3)
            simplify(coords, first, index, sqTolerance);
        coords[index + 2] = maxSqDist;
        if (last - index > 3)
            simplify(coords, index, last, sqTolerance);
    }
}
/**
 * Claculates the square distance from a point to a segment
 * @param px - x coordinate of the point
 * @param py - y coordinate of the point
 * @param x - x coordinate of the first segment endpoint
 * @param y - y coordinate of the first segment endpoint
 * @param bx - x coordinate of the second segment endpoint
 * @param by - y coordinate of the second segment endpoint
 * @returns square distance from a point to a segment
 */
function getSqSegDist(px, py, x, y, bx, by) {
    let dx = bx - x;
    let dy = by - y;
    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = bx;
            y = by;
        }
        else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = px - x;
    dy = py - y;
    return dx * dx + dy * dy;
}

/**
 *
 * @param id - the feature's ID
 * @param type - the feature's type
 * @param geom - the feature's geometry
 * @param tags - the feature's properties
 * @returns the created feature
 */
function createFeature(id, type, geom, tags) {
    // This is mostly for TypeScript type narrowing
    const data = { type, geom };
    const feature = {
        id: id == null ? null : id,
        type: data.type,
        geometry: data.geom,
        tags,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
    switch (data.type) {
        case 'Point':
        case 'MultiPoint':
        case 'LineString':
            calcLineBBox(feature, data.geom);
            break;
        case 'Polygon':
            // the outer ring (ie [0]) contains all inner rings
            calcLineBBox(feature, data.geom[0]);
            break;
        case 'MultiLineString':
            for (const line of data.geom) {
                calcLineBBox(feature, line);
            }
            break;
        case 'MultiPolygon':
            for (const polygon of data.geom) {
                // the outer ring (ie [0]) contains all inner rings
                calcLineBBox(feature, polygon[0]);
            }
            break;
    }
    return feature;
}
function calcLineBBox(feature, geom) {
    for (let i = 0; i < geom.length; i += 3) {
        feature.minX = Math.min(feature.minX, geom[i]);
        feature.minY = Math.min(feature.minY, geom[i + 1]);
        feature.maxX = Math.max(feature.maxX, geom[i]);
        feature.maxY = Math.max(feature.maxY, geom[i + 1]);
    }
}

/**
 * converts GeoJSON feature into an intermediate projected JSON vector format with simplification data
 * @param data
 * @param options
 * @returns
 */
function convert(data, options) {
    const features = [];
    switch (data.type) {
        case 'FeatureCollection':
            for (let i = 0; i < data.features.length; i++) {
                convertFeature(features, data.features[i], options, i);
            }
            break;
        case 'Feature':
            convertFeature(features, data, options);
            break;
        default:
            convertFeature(features, { geometry: data, properties: undefined }, options);
    }
    return features;
}
function convertFeature(features, geojson, options, index) {
    if (!geojson.geometry)
        return;
    if (geojson.geometry.type === 'GeometryCollection') {
        for (const singleGeometry of geojson.geometry.geometries) {
            convertFeature(features, {
                id: geojson.id,
                geometry: singleGeometry,
                properties: geojson.properties
            }, options, index);
        }
        return;
    }
    const coords = geojson.geometry.coordinates;
    if (!coords?.length)
        return;
    const tolerance = Math.pow(options.tolerance / ((1 << options.maxZoom) * options.extent), 2);
    let id = geojson.id;
    if (options.promoteId) {
        id = geojson.properties?.[options.promoteId];
    }
    else if (options.generateId) {
        id = index || 0;
    }
    switch (geojson.geometry.type) {
        case 'Point': {
            const pointGeometry = [];
            convertPoint(geojson.geometry.coordinates, pointGeometry);
            features.push(createFeature(id, geojson.geometry.type, pointGeometry, geojson.properties));
            return;
        }
        case 'MultiPoint': {
            const multiPointGeometry = [];
            for (const p of geojson.geometry.coordinates) {
                convertPoint(p, multiPointGeometry);
            }
            features.push(createFeature(id, geojson.geometry.type, multiPointGeometry, geojson.properties));
            return;
        }
        case 'LineString': {
            const lineGeometry = [];
            convertLine(geojson.geometry.coordinates, lineGeometry, tolerance, false);
            features.push(createFeature(id, geojson.geometry.type, lineGeometry, geojson.properties));
            return;
        }
        case 'MultiLineString': {
            if (options.lineMetrics) {
                // explode into linestrings in order to track metrics
                for (const line of geojson.geometry.coordinates) {
                    const lineGeometry = [];
                    convertLine(line, lineGeometry, tolerance, false);
                    features.push(createFeature(id, 'LineString', lineGeometry, geojson.properties));
                }
                return;
            }
            const multiLineGeometry = [];
            convertLines(geojson.geometry.coordinates, multiLineGeometry, tolerance, false);
            features.push(createFeature(id, geojson.geometry.type, multiLineGeometry, geojson.properties));
            return;
        }
        case 'Polygon': {
            const polygonGeometry = [];
            convertLines(geojson.geometry.coordinates, polygonGeometry, tolerance, true);
            features.push(createFeature(id, geojson.geometry.type, polygonGeometry, geojson.properties));
            return;
        }
        case 'MultiPolygon': {
            const multiPolygonGeometry = [];
            for (const polygon of geojson.geometry.coordinates) {
                const newPolygon = [];
                convertLines(polygon, newPolygon, tolerance, true);
                multiPolygonGeometry.push(newPolygon);
            }
            features.push(createFeature(id, geojson.geometry.type, multiPolygonGeometry, geojson.properties));
            return;
        }
        default:
            throw new Error('Input data is not a valid GeoJSON object.');
    }
}
function convertPoint(coords, out) {
    out.push(projectX(coords[0]), projectY(coords[1]), 0);
}
function convertLine(ring, out, tolerance, isPolygon) {
    let x0, y0;
    let size = 0;
    for (let j = 0; j < ring.length; j++) {
        const x = projectX(ring[j][0]);
        const y = projectY(ring[j][1]);
        out.push(x, y, 0);
        if (j > 0) {
            if (isPolygon) {
                size += (x0 * y - x * y0) / 2; // area
            }
            else {
                size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
            }
        }
        x0 = x;
        y0 = y;
    }
    const last = out.length - 3;
    out[2] = 1;
    if (tolerance > 0)
        simplify(out, 0, last, tolerance);
    out[last + 2] = 1;
    out.size = Math.abs(size);
    out.start = 0;
    out.end = out.size;
}
function convertLines(rings, out, tolerance, isPolygon) {
    for (let i = 0; i < rings.length; i++) {
        const geom = [];
        convertLine(rings[i], geom, tolerance, isPolygon);
        out.push(geom);
    }
}
function projectX(x) {
    return x / 360 + 0.5;
}
function projectY(y) {
    const sin = Math.sin(y * Math.PI / 180);
    const y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
    return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}

/* clip features between two vertical or horizontal axis-parallel lines:
 *     |        |
 *  ___|___     |     /
 * /   |   \____|____/
 *     |        |
 *
 * k1 and k2 are the line coordinates
 * axis: 0 for x, 1 for y
 * minAll and maxAll: minimum and maximum coordinate value for all features
 */
function clip(features, scale, k1, k2, axis, minAll, maxAll, options) {
    k1 /= scale;
    k2 /= scale;
    if (minAll >= k1 && maxAll < k2) { // trivial accept
        return features;
    }
    if (maxAll < k1 || minAll >= k2) { // trivial reject
        return null;
    }
    const clipped = [];
    for (const feature of features) {
        const min = axis === 0 ? feature.minX : feature.minY;
        const max = axis === 0 ? feature.maxX : feature.maxY;
        if (min >= k1 && max < k2) { // trivial accept
            clipped.push(feature);
            continue;
        }
        if (max < k1 || min >= k2) { // trivial reject
            continue;
        }
        switch (feature.type) {
            case 'Point':
            case 'MultiPoint': {
                const pointGeometry = [];
                clipPoints(feature.geometry, pointGeometry, k1, k2, axis);
                if (!pointGeometry.length)
                    continue;
                const type = pointGeometry.length === 3 ? 'Point' : 'MultiPoint';
                clipped.push(createFeature(feature.id, type, pointGeometry, feature.tags));
                continue;
            }
            case 'LineString': {
                const lineGeometry = [];
                clipLine(feature.geometry, lineGeometry, k1, k2, axis, false, options.lineMetrics);
                if (!lineGeometry.length)
                    continue;
                if (options.lineMetrics) {
                    for (const line of lineGeometry) {
                        clipped.push(createFeature(feature.id, feature.type, line, feature.tags));
                    }
                    continue;
                }
                if (lineGeometry.length > 1) {
                    clipped.push(createFeature(feature.id, "MultiLineString", lineGeometry, feature.tags));
                    continue;
                }
                clipped.push(createFeature(feature.id, feature.type, lineGeometry[0], feature.tags));
                continue;
            }
            case 'MultiLineString': {
                const multiLineGeometry = [];
                clipLines(feature.geometry, multiLineGeometry, k1, k2, axis, false);
                if (!multiLineGeometry.length)
                    continue;
                if (multiLineGeometry.length === 1) {
                    clipped.push(createFeature(feature.id, "LineString", multiLineGeometry[0], feature.tags));
                    continue;
                }
                clipped.push(createFeature(feature.id, feature.type, multiLineGeometry, feature.tags));
                continue;
            }
            case 'Polygon': {
                const polygonGeometry = [];
                clipLines(feature.geometry, polygonGeometry, k1, k2, axis, true);
                if (!polygonGeometry.length)
                    continue;
                clipped.push(createFeature(feature.id, feature.type, polygonGeometry, feature.tags));
                continue;
            }
            case 'MultiPolygon': {
                const multiPolygonGeometry = [];
                for (const polygon of feature.geometry) {
                    const newPolygon = [];
                    clipLines(polygon, newPolygon, k1, k2, axis, true);
                    if (newPolygon.length)
                        multiPolygonGeometry.push(newPolygon);
                }
                if (!multiPolygonGeometry.length)
                    continue;
                clipped.push(createFeature(feature.id, feature.type, multiPolygonGeometry, feature.tags));
                continue;
            }
        }
    }
    if (!clipped.length)
        return null;
    return clipped;
}
function clipPoints(geom, newGeom, k1, k2, axis) {
    for (let i = 0; i < geom.length; i += 3) {
        const a = geom[i + axis];
        if (a >= k1 && a <= k2) {
            addPoint(newGeom, geom[i], geom[i + 1], geom[i + 2]);
        }
    }
}
function clipLine(geom, newGeom, k1, k2, axis, isPolygon, trackMetrics) {
    let slice = newSlice(geom);
    const intersect = axis === 0 ? intersectX : intersectY;
    let len = geom.start;
    let segLen, t;
    for (let i = 0; i < geom.length - 3; i += 3) {
        const ax = geom[i];
        const ay = geom[i + 1];
        const az = geom[i + 2];
        const bx = geom[i + 3];
        const by = geom[i + 4];
        const a = axis === 0 ? ax : ay;
        const b = axis === 0 ? bx : by;
        let exited = false;
        if (trackMetrics)
            segLen = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        if (a < k1) {
            // ---|-->  | (line enters the clip region from the left)
            if (b > k1) {
                t = intersect(slice, ax, ay, bx, by, k1);
                if (trackMetrics)
                    slice.start = len + segLen * t;
            }
        }
        else if (a > k2) {
            // |  <--|--- (line enters the clip region from the right)
            if (b < k2) {
                t = intersect(slice, ax, ay, bx, by, k2);
                if (trackMetrics)
                    slice.start = len + segLen * t;
            }
        }
        else {
            addPoint(slice, ax, ay, az);
        }
        if (b < k1 && a >= k1) {
            // <--|---  | or <--|-----|--- (line exits the clip region on the left)
            t = intersect(slice, ax, ay, bx, by, k1);
            exited = true;
        }
        if (b > k2 && a <= k2) {
            // |  ---|--> or ---|-----|--> (line exits the clip region on the right)
            t = intersect(slice, ax, ay, bx, by, k2);
            exited = true;
        }
        if (!isPolygon && exited) {
            if (trackMetrics)
                slice.end = len + segLen * t;
            newGeom.push(slice);
            slice = newSlice(geom);
        }
        if (trackMetrics)
            len += segLen;
    }
    // add the last point
    let last = geom.length - 3;
    const ax = geom[last];
    const ay = geom[last + 1];
    const az = geom[last + 2];
    const a = axis === 0 ? ax : ay;
    if (a >= k1 && a <= k2)
        addPoint(slice, ax, ay, az);
    // close the polygon if its endpoints are not the same after clipping
    last = slice.length - 3;
    if (isPolygon && last >= 3 && (slice[last] !== slice[0] || slice[last + 1] !== slice[1])) {
        addPoint(slice, slice[0], slice[1], slice[2]);
    }
    // add the final slice
    if (slice.length) {
        newGeom.push(slice);
    }
}
function newSlice(line) {
    const slice = [];
    slice.size = line.size;
    slice.start = line.start;
    slice.end = line.end;
    return slice;
}
function clipLines(geom, newGeom, k1, k2, axis, isPolygon) {
    for (const line of geom) {
        clipLine(line, newGeom, k1, k2, axis, isPolygon, false);
    }
}
function addPoint(out, x, y, z) {
    out.push(x, y, z);
}
function intersectX(out, ax, ay, bx, by, x) {
    const t = (x - ax) / (bx - ax);
    addPoint(out, x, ay + (by - ay) * t, 1);
    return t;
}
function intersectY(out, ax, ay, bx, by, y) {
    const t = (y - ay) / (by - ay);
    addPoint(out, ax + (bx - ax) * t, y, 1);
    return t;
}

function wrap(features, options) {
    const buffer = options.buffer / options.extent;
    let merged = features;
    const left = clip(features, 1, -1 - buffer, buffer, 0, -1, 2, options); // left world copy
    const right = clip(features, 1, 1 - buffer, 2 + buffer, 0, -1, 2, options); // right world copy
    if (!left && !right)
        return merged;
    merged = clip(features, 1, -buffer, 1 + buffer, 0, -1, 2, options) || []; // center world copy
    if (left)
        merged = shiftFeatureCoords(left, 1).concat(merged); // merge left into center
    if (right)
        merged = merged.concat(shiftFeatureCoords(right, -1)); // merge right into center
    return merged;
}
function shiftFeatureCoords(features, offset) {
    const newFeatures = [];
    for (const feature of features) {
        switch (feature.type) {
            case 'Point':
            case 'MultiPoint':
            case 'LineString': {
                const newGeometry = shiftCoords(feature.geometry, offset);
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
            case 'MultiLineString':
            case 'Polygon': {
                const newGeometry = [];
                for (const line of feature.geometry) {
                    newGeometry.push(shiftCoords(line, offset));
                }
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
            case 'MultiPolygon': {
                const newGeometry = [];
                for (const polygon of feature.geometry) {
                    const newPolygon = [];
                    for (const line of polygon) {
                        newPolygon.push(shiftCoords(line, offset));
                    }
                    newGeometry.push(newPolygon);
                }
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
        }
    }
    return newFeatures;
}
function shiftCoords(points, offset) {
    const newPoints = [];
    newPoints.size = points.size;
    if (points.start !== undefined) {
        newPoints.start = points.start;
        newPoints.end = points.end;
    }
    for (let i = 0; i < points.length; i += 3) {
        newPoints.push(points[i] + offset, points[i + 1], points[i + 2]);
    }
    return newPoints;
}

/**
 * Transforms the coordinates of each feature in the given tile from
 * mercator-projected space into (extent x extent) tile space.
 * @param tile - the tile to transform, this gets modified in place
 * @param extent - the tile extent (usually 4096)
 * @returns the transformed tile
 */
function transformTile(tile, extent) {
    if (tile.transformed) {
        return tile;
    }
    const z2 = 1 << tile.z;
    const tx = tile.x;
    const ty = tile.y;
    for (const feature of tile.features) {
        if (feature.type === 1) {
            const pointGeometry = [];
            for (let j = 0; j < feature.geometry.length; j += 2) {
                pointGeometry.push(transformPoint(feature.geometry[j], feature.geometry[j + 1], extent, z2, tx, ty));
            }
            feature.geometry = pointGeometry;
            continue;
        }
        const geometry = [];
        for (const singleGeom of feature.geometry) {
            const ring = [];
            for (let k = 0; k < singleGeom.length; k += 2) {
                ring.push(transformPoint(singleGeom[k], singleGeom[k + 1], extent, z2, tx, ty));
            }
            geometry.push(ring);
        }
        feature.geometry = geometry;
    }
    tile.transformed = true;
    return tile;
}
function transformPoint(x, y, extent, z2, tx, ty) {
    return [
        Math.round(extent * (x * z2 - tx)),
        Math.round(extent * (y * z2 - ty))
    ];
}

/**
 * Creates a tile object from the given features
 * @param features - the features to include in the tile
 * @param z
 * @param tx
 * @param ty
 * @param options - the options object
 * @returns the created tile
 */
function createTile(features, z, tx, ty, options) {
    const tolerance = z === options.maxZoom ? 0 : options.tolerance / ((1 << z) * options.extent);
    const tile = {
        features: [],
        numPoints: 0,
        numSimplified: 0,
        numFeatures: features.length,
        source: null,
        x: tx,
        y: ty,
        z,
        transformed: false,
        minX: 2,
        minY: 1,
        maxX: -1,
        maxY: 0
    };
    for (const feature of features) {
        addFeature(tile, feature, tolerance, options);
    }
    return tile;
}
function addFeature(tile, feature, tolerance, options) {
    tile.minX = Math.min(tile.minX, feature.minX);
    tile.minY = Math.min(tile.minY, feature.minY);
    tile.maxX = Math.max(tile.maxX, feature.maxX);
    tile.maxY = Math.max(tile.maxY, feature.maxY);
    let tags = feature.tags || null;
    let tileFeature;
    switch (feature.type) {
        case 'Point':
        case 'MultiPoint': {
            const geometry = [];
            for (let i = 0; i < feature.geometry.length; i += 3) {
                geometry.push(feature.geometry[i], feature.geometry[i + 1]);
                tile.numPoints++;
                tile.numSimplified++;
            }
            if (!geometry.length)
                return;
            tileFeature = {
                type: 1,
                tags: tags,
                geometry: geometry
            };
            break;
        }
        case 'LineString': {
            const geometry = [];
            addLine(geometry, feature.geometry, tile, tolerance, false, false);
            if (!geometry.length)
                return;
            if (options.lineMetrics) {
                tags = {};
                for (const key in feature.tags)
                    tags[key] = feature.tags[key];
                // HM TODO: replace with geojsonvt
                tags['mapbox_clip_start'] = feature.geometry.start / feature.geometry.size;
                tags['mapbox_clip_end'] = feature.geometry.end / feature.geometry.size;
            }
            tileFeature = {
                type: 2,
                tags: tags,
                geometry: geometry
            };
            break;
        }
        case 'MultiLineString':
        case 'Polygon': {
            const geometry = [];
            for (let i = 0; i < feature.geometry.length; i++) {
                addLine(geometry, feature.geometry[i], tile, tolerance, feature.type === 'Polygon', i === 0);
            }
            if (!geometry.length)
                return;
            tileFeature = {
                type: feature.type === 'Polygon' ? 3 : 2,
                tags: tags,
                geometry: geometry
            };
            break;
        }
        case 'MultiPolygon': {
            const geometry = [];
            for (let k = 0; k < feature.geometry.length; k++) {
                const polygon = feature.geometry[k];
                for (let i = 0; i < polygon.length; i++) {
                    addLine(geometry, polygon[i], tile, tolerance, true, i === 0);
                }
            }
            if (!geometry.length)
                return;
            tileFeature = {
                type: 3,
                tags: tags,
                geometry: geometry
            };
            break;
        }
    }
    if (feature.id !== null) {
        tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
}
function addLine(result, geom, tile, tolerance, isPolygon, isOuter) {
    const sqTolerance = tolerance * tolerance;
    if (tolerance > 0 && (geom.size < (isPolygon ? sqTolerance : tolerance))) {
        tile.numPoints += geom.length / 3;
        return;
    }
    const ring = [];
    for (let i = 0; i < geom.length; i += 3) {
        if (tolerance === 0 || geom[i + 2] > sqTolerance) {
            tile.numSimplified++;
            ring.push(geom[i], geom[i + 1]);
        }
        tile.numPoints++;
    }
    if (isPolygon)
        rewind(ring, isOuter);
    result.push(ring);
}
function rewind(ring, clockwise) {
    let area = 0;
    for (let i = 0, len = ring.length, j = len - 2; i < len; j = i, i += 2) {
        area += (ring[i] - ring[j]) * (ring[i + 1] + ring[j + 1]);
    }
    if (area > 0 !== clockwise)
        return;
    for (let i = 0, len = ring.length; i < len / 2; i += 2) {
        const x = ring[i];
        const y = ring[i + 1];
        ring[i] = ring[len - 2 - i];
        ring[i + 1] = ring[len - 1 - i];
        ring[len - 2 - i] = x;
        ring[len - 1 - i] = y;
    }
}

/**
 * Applies a GeoJSON Source Diff to an existing set of simplified features
 * @param source
 * @param dataDiff
 * @param options
 * @returns
 */
function applySourceDiff(source, dataDiff, options) {
    // convert diff to sets/maps for o(1) lookups
    const diff = diffToHashed(dataDiff);
    // collection for features that will be affected by this update
    let affected = [];
    // full removal - clear everything before applying diff
    if (diff.removeAll) {
        affected = source;
        source = [];
    }
    // remove/add features and collect affected ones
    if (diff.remove.size || diff.add.size) {
        const removeFeatures = [];
        // collect source features to be removed
        for (const feature of source) {
            const { id } = feature;
            // explicit feature removal
            if (diff.remove.has(id)) {
                removeFeatures.push(feature);
                // feature with duplicate id being added
            }
            else if (diff.add.has(id)) {
                removeFeatures.push(feature);
            }
        }
        // collect affected and remove from source
        if (removeFeatures.length) {
            affected.push(...removeFeatures);
            const removeIds = new Set(removeFeatures.map(f => f.id));
            source = source.filter(f => !removeIds.has(f.id));
        }
        // convert and add new features
        if (diff.add.size) {
            // projects and adds simplification info
            let addFeatures = convert({ type: 'FeatureCollection', features: Array.from(diff.add.values()) }, options);
            // wraps features (ie extreme west and extreme east)
            addFeatures = wrap(addFeatures, options);
            affected.push(...addFeatures);
            source.push(...addFeatures);
        }
    }
    if (diff.update.size) {
        for (const [id, update] of diff.update) {
            const featureIndex = source.findIndex(f => f.id === id);
            if (featureIndex === -1)
                continue;
            const feature = source[featureIndex];
            // get updated geojsonvt simplified feature
            const updatedFeature = getUpdatedFeature(feature, update, options);
            if (!updatedFeature)
                continue;
            // track both features for invalidation
            affected.push(feature, updatedFeature);
            // replace old feature with updated feature
            source[featureIndex] = updatedFeature;
        }
    }
    return { affected, source };
}
// return an updated geojsonvt simplified feature
function getUpdatedFeature(vtFeature, update, options) {
    const changeGeometry = !!update.newGeometry;
    const changeProps = update.removeAllProperties ||
        update.removeProperties?.length > 0 ||
        update.addOrUpdateProperties?.length > 0;
    // if geometry changed, need to create new geojson feature and convert to simplified format
    if (changeGeometry) {
        const geojsonFeature = {
            type: 'Feature',
            id: vtFeature.id,
            geometry: update.newGeometry,
            properties: changeProps ? applyPropertyUpdates(vtFeature.tags, update) : vtFeature.tags
        };
        // projects and adds simplification info
        let features = convert({ type: 'FeatureCollection', features: [geojsonFeature] }, options);
        // wraps features (ie extreme west and extreme east)
        features = wrap(features, options);
        return features[0];
    }
    // only properties changed - update tags directly
    if (changeProps) {
        const feature = { ...vtFeature };
        feature.tags = applyPropertyUpdates(feature.tags, update);
        return feature;
    }
    return null;
}
/**
 * helper to apply property updates from a diff update object to a properties object
 */
function applyPropertyUpdates(tags, update) {
    if (update.removeAllProperties) {
        return {};
    }
    const properties = { ...tags || {} };
    if (update.removeProperties) {
        for (const key of update.removeProperties) {
            delete properties[key];
        }
    }
    if (update.addOrUpdateProperties) {
        for (const { key, value } of update.addOrUpdateProperties) {
            properties[key] = value;
        }
    }
    return properties;
}
/**
 * Convert a GeoJSON Source Diff to an idempotent hashed representation using Sets and Maps
 */
function diffToHashed(diff) {
    if (!diff)
        return {
            remove: new Set(),
            add: new Map(),
            update: new Map()
        };
    const hashed = {
        removeAll: diff.removeAll,
        remove: new Set(diff.remove || []),
        add: new Map(diff.add?.map(feature => [feature.id, feature])),
        update: new Map(diff.update?.map(update => [update.id, update]))
    };
    return hashed;
}

const defaultOptions = {
    maxZoom: 14,
    indexMaxZoom: 5,
    indexMaxPoints: 100000,
    tolerance: 3,
    extent: 4096,
    buffer: 64,
    lineMetrics: false,
    promoteId: null,
    generateId: false,
    updateable: false,
    debug: 0
};
/**
 * Main class for creating and managing a vector tile index from GeoJSON data.
 */
class GeoJSONVT {
    options;
    /** @internal */
    tiles;
    tileCoords;
    /** @internal */
    stats = {};
    /** @internal */
    total = 0;
    source;
    constructor(data, options) {
        options = this.options = Object.assign({}, defaultOptions, options);
        const debug = options.debug;
        if (debug)
            console.time('preprocess data');
        if (options.maxZoom < 0 || options.maxZoom > 24)
            throw new Error('maxZoom should be in the 0-24 range');
        if (options.promoteId && options.generateId)
            throw new Error('promoteId and generateId cannot be used together.');
        // projects and adds simplification info
        let features = convert(data, options);
        // tiles and tileCoords are part of the public API
        this.tiles = {};
        this.tileCoords = [];
        if (debug) {
            console.timeEnd('preprocess data');
            console.log('index: maxZoom: %d, maxPoints: %d', options.indexMaxZoom, options.indexMaxPoints);
            console.time('generate tiles');
            this.stats = {};
            this.total = 0;
        }
        // wraps features (ie extreme west and extreme east)
        features = wrap(features, options);
        // start slicing from the top tile down
        if (features.length) {
            this.splitTile(features, 0, 0, 0);
        }
        // for updateable indexes, store a copy of the original simplified features
        if (options.updateable) {
            this.source = features;
        }
        if (debug) {
            if (features.length)
                console.log('features: %d, points: %d', this.tiles[0].numFeatures, this.tiles[0].numPoints);
            console.timeEnd('generate tiles');
            console.log('tiles generated:', this.total, JSON.stringify(this.stats));
        }
    }
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
    splitTile(features, z, x, y, cz, cx, cy) {
        const stack = [features, z, x, y];
        const options = this.options;
        const debug = options.debug;
        // avoid recursion by using a processing queue
        while (stack.length) {
            y = stack.pop();
            x = stack.pop();
            z = stack.pop();
            features = stack.pop();
            const z2 = 1 << z;
            const id = toID(z, x, y);
            let tile = this.tiles[id];
            if (!tile) {
                if (debug > 1)
                    console.time('creation');
                tile = this.tiles[id] = createTile(features, z, x, y, options);
                this.tileCoords.push({ z, x, y, id });
                if (debug) {
                    if (debug > 1) {
                        console.log('tile z%d-%d-%d (features: %d, points: %d, simplified: %d)', z, x, y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                        console.timeEnd('creation');
                    }
                    const key = `z${z}`;
                    this.stats[key] = (this.stats[key] || 0) + 1;
                    this.total++;
                }
            }
            // save reference to original geometry in tile so that we can drill down later if we stop now
            tile.source = features;
            // if it's the first-pass tiling
            if (cz == null) {
                // stop tiling if we reached max zoom, or if the tile is too simple
                if (z === options.indexMaxZoom || tile.numPoints <= options.indexMaxPoints)
                    continue;
                // if a drilldown to a specific tile
            }
            else if (z === options.maxZoom || z === cz) {
                // stop tiling if we reached base zoom or our target tile zoom
                continue;
            }
            else if (cz != null) {
                // stop tiling if it's not an ancestor of the target tile
                const zoomSteps = cz - z;
                if (x !== cx >> zoomSteps || y !== cy >> zoomSteps)
                    continue;
            }
            // if we slice further down, no need to keep source geometry
            tile.source = null;
            if (!features.length)
                continue;
            if (debug > 1)
                console.time('clipping');
            // values we'll use for clipping
            const k1 = 0.5 * options.buffer / options.extent;
            const k2 = 0.5 - k1;
            const k3 = 0.5 + k1;
            const k4 = 1 + k1;
            let tl = null;
            let bl = null;
            let tr = null;
            let br = null;
            const left = clip(features, z2, x - k1, x + k3, 0, tile.minX, tile.maxX, options);
            const right = clip(features, z2, x + k2, x + k4, 0, tile.minX, tile.maxX, options);
            if (left) {
                tl = clip(left, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
                bl = clip(left, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
            }
            if (right) {
                tr = clip(right, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
                br = clip(right, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
            }
            if (debug > 1)
                console.timeEnd('clipping');
            stack.push(tl || [], z + 1, x * 2, y * 2);
            stack.push(bl || [], z + 1, x * 2, y * 2 + 1);
            stack.push(tr || [], z + 1, x * 2 + 1, y * 2);
            stack.push(br || [], z + 1, x * 2 + 1, y * 2 + 1);
        }
    }
    /**
     * Given z, x, and y tile coordinates, returns the corresponding tile with geometries in tile coordinates, much like MVT data is stored.
     * @param z - tile zoom level
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @returns the transformed tile or null if not found
     */
    getTile(z, x, y) {
        z = +z;
        x = +x;
        y = +y;
        const options = this.options;
        const { extent, debug } = options;
        if (z < 0 || z > 24)
            return null;
        const z2 = 1 << z;
        x = (x + z2) & (z2 - 1); // wrap tile x coordinate
        const id = toID(z, x, y);
        if (this.tiles[id]) {
            return transformTile(this.tiles[id], extent);
        }
        if (debug > 1)
            console.log('drilling down to z%d-%d-%d', z, x, y);
        let z0 = z;
        let x0 = x;
        let y0 = y;
        let parent;
        while (!parent && z0 > 0) {
            z0--;
            x0 = x0 >> 1;
            y0 = y0 >> 1;
            parent = this.tiles[toID(z0, x0, y0)];
        }
        if (!parent?.source)
            return null;
        // if we found a parent tile containing the original geometry, we can drill down from it
        if (debug > 1) {
            console.log('found parent tile z%d-%d-%d', z0, x0, y0);
            console.time('drilling down');
        }
        this.splitTile(parent.source, z0, x0, y0, z, x, y);
        if (debug > 1)
            console.timeEnd('drilling down');
        if (!this.tiles[id])
            return null;
        return transformTile(this.tiles[id], extent);
    }
    /**
     * Invalidates (removes) tiles affected by the provided features
     * @internal
     * @param features
     */
    invalidateTiles(features) {
        const options = this.options;
        const { debug } = options;
        // calculate bounding box of all features for trivial reject
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const feature of features) {
            minX = Math.min(minX, feature.minX);
            maxX = Math.max(maxX, feature.maxX);
            minY = Math.min(minY, feature.minY);
            maxY = Math.max(maxY, feature.maxY);
        }
        // tile buffer clipping value - not halved as in splitTile above because checking against tile's own extent
        const k1 = options.buffer / options.extent;
        // track removed tile ids for o(1) lookup
        const removedLookup = new Set();
        // iterate through existing tiles and remove ones that are affected by features
        for (const id in this.tiles) {
            const tile = this.tiles[id];
            // calculate tile bounds including buffer
            const z2 = 1 << tile.z;
            const tileMinX = (tile.x - k1) / z2;
            const tileMaxX = (tile.x + 1 + k1) / z2;
            const tileMinY = (tile.y - k1) / z2;
            const tileMaxY = (tile.y + 1 + k1) / z2;
            // trivial reject if feature bounds don't intersect tile
            if (maxX < tileMinX || minX >= tileMaxX ||
                maxY < tileMinY || minY >= tileMaxY) {
                continue;
            }
            // check if any feature intersects with the tile
            let intersects = false;
            for (const feature of features) {
                if (feature.maxX >= tileMinX && feature.minX < tileMaxX &&
                    feature.maxY >= tileMinY && feature.minY < tileMaxY) {
                    intersects = true;
                    break;
                }
            }
            if (!intersects)
                continue;
            if (debug) {
                if (debug > 1) {
                    console.log('invalidate tile z%d-%d-%d (features: %d, points: %d, simplified: %d)', tile.z, tile.x, tile.y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                }
                const key = `z${tile.z}`;
                this.stats[key] = (this.stats[key] || 0) - 1;
                this.total--;
            }
            delete this.tiles[id];
            removedLookup.add(id);
        }
        // remove tile coords that are no longer in the index
        if (removedLookup.size) {
            this.tileCoords = this.tileCoords.filter(c => !removedLookup.has(c.id));
        }
    }
    /**
     * Updates the tile index by adding and/or removing geojson features
     * invalidates tiles that are affected by the update for regeneration on next getTile call.
     * @param diff - the source diff object
     */
    updateData(diff) {
        const options = this.options;
        const debug = options.debug;
        if (!options.updateable)
            throw new Error('to update tile geojson `updateable` option must be set to true');
        // apply diff and collect affected features and updated source that will be used to invalidate tiles
        const { affected, source } = applySourceDiff(this.source, diff, options);
        // nothing has changed
        if (!affected.length)
            return;
        // update source with new simplified feature set
        this.source = source;
        if (debug > 1) {
            console.log('invalidating tiles');
            console.time('invalidating');
        }
        this.invalidateTiles(affected);
        if (debug > 1)
            console.timeEnd('invalidating');
        // re-generate root tile with updated feature set
        const [z, x, y] = [0, 0, 0];
        const rootTile = createTile(this.source, z, x, y, this.options);
        rootTile.source = this.source;
        // update tile index with new root tile - ready for getTile calls
        const id = toID(z, x, y);
        this.tiles[id] = rootTile;
        this.tileCoords.push({ z, x, y, id });
        if (debug) {
            const key = `z${z}`;
            this.stats[key] = (this.stats[key] || 0) + 1;
            this.total++;
        }
    }
}
function toID(z, x, y) {
    return (((1 << z) * y + x) * 32) + z;
}
function geojsonvt(data, options) {
    return new GeoJSONVT(data, options);
}

return geojsonvt;

}));
