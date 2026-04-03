import { CSSProperties } from "react";
import { Marker } from "../../types";
import { IBuilder } from "./types";
export declare class MarkerBuilder implements IBuilder<Marker> {
    private name;
    private coords?;
    private latLng?;
    private style?;
    constructor(value: string);
    /**
     *
     * @param value
     */
    setName(value: string): this;
    /**
     *
     * @param value
     */
    setCoords(value: number[]): this;
    /**
     *
     * @param value
     */
    setLatLng(value: number[]): this;
    /**
     *
     * @param value
     */
    setStyle(value: CSSProperties): this;
    /**
     *
     */
    build(): {
        coords: number[];
        name: string;
        style: CSSProperties | undefined;
    } | {
        latLng: number[];
        name: string;
        style: CSSProperties | undefined;
    };
}
