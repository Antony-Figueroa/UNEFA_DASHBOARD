import { ILabels, ILabelsProps } from "../../types";
import { IBuilder } from "./types";
export declare class LabelsBuilder implements IBuilder<ILabels> {
    private markers?;
    private regions?;
    /**
     *
     * @param values
     */
    addMarkersLabelProps(...values: ILabelsProps[]): this;
    /**
     *
     * @param values
     */
    addRegionsLabelProps(...values: ILabelsProps[]): this;
    build(): {
        [k: string]: unknown;
    };
}
