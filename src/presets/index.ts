import {Glob} from "bun";
import SwaggerPkg from "./plugins/swagger";
import CorsPkg from "./plugins/cors";
import LoggerPkg from "./plugins/logger";
import type {IPlugin} from "./plugins";

export const presetPlugins: Array<IPlugin> = [
    {
        name: "swagger",
        execute: SwaggerPkg,
        option: {}
    },
    {
        name: "cors",
        execute: CorsPkg,
        option: {}
    },
    {
        name: "logger",
        execute: LoggerPkg,
        option: {}
    },
];
