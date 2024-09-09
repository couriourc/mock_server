import {Glob} from "bun";
import SwaggerPkg from "./plugins/swagger";
import type {IPlugin} from "./plugins";

export const presetPlugins: Array<IPlugin> = [
    {
        name: "swagger",
        execute: SwaggerPkg,
        option: {}
    }
];
