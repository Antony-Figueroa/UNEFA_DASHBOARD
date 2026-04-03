import { CSSProperties } from "react";
import { ISVGElementStyleAttributes } from "../../types";
import { IBuilder } from "./types";
export declare class StyleBuilder implements IBuilder<ISVGElementStyleAttributes> {
    private initial?;
    private selected?;
    private hover?;
    private selectedHover?;
    /**
     *
     * @param value
     */
    setInitial(value: CSSProperties): this;
    /**
     *
     * @param value
     */
    setSelected(value: CSSProperties): this;
    /**
     *
     * @param value
     */
    setHover(value: CSSProperties): this;
    /**
     *
     * @param value
     */
    setSelectedHover(value: CSSProperties): this;
    build(): {
        [k: string]: unknown;
    };
}
