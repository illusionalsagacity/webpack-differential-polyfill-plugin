import { Compiler } from "webpack";
export interface Options {
    filename: {
        module: string;
        nomodule: string;
    };
    shippedProposals?: boolean;
    defer?: boolean;
}
export declare class DifferentialPolyfillPlugin {
    options: Required<Options>;
    constructor(options?: Options);
    apply(compiler: Compiler): void;
}
