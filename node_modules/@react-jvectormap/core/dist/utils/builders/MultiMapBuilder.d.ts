import { IMainMap, IMultiMapProps, IVectorMap } from "../../types";
import { IBuilder } from "./types";
export declare class MultiMapBuilder implements IBuilder<IMultiMapProps> {
    private readonly main;
    private maxLevel?;
    private mapNameByCode?;
    private mapUrlByCode?;
    private getDrillDownMap?;
    constructor(mainMap: IVectorMap, maxLevel?: number);
    /**
     *
     * @param value
     */
    setMainMap(value: IVectorMap): this;
    /**
     *
     * @param value
     */
    setMaxLevel(value: number): this;
    /**
     *
     * @param value
     */
    setMapNameByCode(value: (code: string) => string): this;
    /**
     *
     * @param value
     */
    setUrlByCode(value: (code: string) => string): this;
    /**
     *
     * @param value
     */
    setGetDrillDownMap(value: (code: string) => Promise<IVectorMap> | IVectorMap): this;
    build(): {
        main: IMainMap;
        maxLevel: number | undefined;
    };
}
