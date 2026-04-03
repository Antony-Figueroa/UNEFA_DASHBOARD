import { IAttributeSeries, NormalizeFunctionType } from "../../types";
import { IBuilder } from "./types";
export declare class AttributeSeriesBuilder implements IBuilder<IAttributeSeries> {
    private attribute;
    private scale?;
    private values?;
    private normalizeFunction?;
    constructor(attribute: string);
    /**
     *
     * @param value
     */
    setAttribute(value: string): this;
    /**
     *
     * @param value
     */
    setScale(value: number[]): this;
    /**
     *
     * @param value
     */
    setValues(value: number[]): this;
    /**
     *
     * @param value
     */
    setNormalizeFunction(value: NormalizeFunctionType): this;
    build(): {
        scale: number[] | undefined;
        values: number[] | undefined;
        attribute: string;
        normalizeFunction: NormalizeFunctionType | undefined;
    };
}
