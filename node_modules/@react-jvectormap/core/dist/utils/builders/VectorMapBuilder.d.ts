import { ILabels, ISeries, ISVGElementStyleAttributes, IVectorMap, IVectorMapProps, Marker, OnRegionTipShow, SelectedEntities } from "../../types";
import { IBuilder } from "./types";
export declare class VectorMapBuilder implements IBuilder<IVectorMapProps> {
    private map;
    private backgroundColor?;
    private zoomMin?;
    private zoomMax?;
    private markers?;
    private markerStyle?;
    private regionStyle?;
    private regionsSelectable?;
    private markersSelectable?;
    private onRegionTipShow?;
    private series?;
    private labels?;
    private selectedRegions?;
    constructor(map: IVectorMap);
    /**
     *
     * @param value
     */
    setMap(value: IVectorMap): this;
    /**
     *
     * @param value
     */
    setBackgroundColor(value: string): this;
    /**
     *
     * @param value
     */
    setZoomMin(value: number): this;
    /**
     *
     * @param value
     */
    setZoomMax(value: number): this;
    /**
     *
     * @param marker
     */
    addMarker(marker: Marker): this;
    /**
     *
     * @param value
     */
    setMarkerStyle(value: ISVGElementStyleAttributes): this;
    /**
     *
     * @param value
     */
    setRegionStyle(value: ISVGElementStyleAttributes | ((code: string) => ISVGElementStyleAttributes)): this;
    /**
     *
     * @param value
     * @private
     */
    setMarkersSelectable(value: boolean): this;
    /**
     *
     * @param value
     */
    setMarkers(value: Marker[]): this;
    /**
     *
     * @private
     * @param value
     */
    setRegionsSelectable(value: boolean): this;
    /**
     *
     * @private
     * @param value
     */
    setOnRegionTipShow(value: OnRegionTipShow): this;
    /**
     *
     * @param value
     */
    setSeries(value: ISeries): this;
    /**
     *
     * @param values
     */
    setLabels(values: ILabels): this;
    /**
     *
     * @param value
     */
    setSelectedRegions(value: SelectedEntities): this;
    /**
     *
     */
    build(): {
        map: IVectorMap;
        series: ISeries | undefined;
        backgroundColor: string | undefined;
        zoomMax: number | undefined;
        zoomMin: number | undefined;
        markerStyle: ISVGElementStyleAttributes | undefined;
        regionStyle: ISVGElementStyleAttributes | ((code: string) => ISVGElementStyleAttributes) | undefined;
        markersSelectable: boolean | undefined;
        regionsSelectable: boolean | undefined;
        markers: Marker[] | undefined;
        labels: ILabels | undefined;
        selectedRegions: SelectedEntities | undefined;
    };
}
