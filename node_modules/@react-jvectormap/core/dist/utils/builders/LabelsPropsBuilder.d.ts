import { GetOffsets, ILabelsProps, RenderLabel } from "../../types";
import { IBuilder } from "./types";
export declare class LabelsPropsBuilder implements IBuilder<ILabelsProps> {
    private render;
    private offsets;
    constructor(render: RenderLabel, offsets: GetOffsets);
    /**
     *
     * @param render
     */
    setRender(render: RenderLabel): this;
    /**
     *
     * @param offsets
     */
    setOffsets(offsets: GetOffsets): this;
    /**
     *
     */
    build(): {
        render: RenderLabel;
        offsets: GetOffsets;
    };
}
