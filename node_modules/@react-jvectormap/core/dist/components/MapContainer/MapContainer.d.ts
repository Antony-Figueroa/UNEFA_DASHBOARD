import { CSSProperties, FC, Ref } from "react";
interface IMapContainerProps {
    style?: CSSProperties;
    className?: string;
    containerRef: Ref<HTMLDivElement>;
}
export declare const MapContainer: FC<IMapContainerProps>;
export {};
