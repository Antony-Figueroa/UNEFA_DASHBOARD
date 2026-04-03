import { IAttributeSeries, ISeries } from "../../types";
import { IBuilder } from "./types";
export declare class SeriesBuilder implements IBuilder<ISeries> {
    private markers?;
    private regions?;
    /**
     *
     * @param values
     */
    addMarkersSeries(...values: IAttributeSeries[]): this;
    /**
     *
     * @param values
     */
    addRegionsSeries(...values: IAttributeSeries[]): this;
    build(): {
        [k: string]: unknown;
    };
}
