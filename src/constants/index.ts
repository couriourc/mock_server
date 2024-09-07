import type {IConfigParameter} from "../types";
import * as process from "process";

export {default as COLOR_MAPS} from "./colors.ts";

export const DEFAULT_CONFIG: IConfigParameter = {
    ROOT_DIR: process.env.NODE_ENV === "development" ? "example" : ".",
    API_DIR: 'apis',
    STATIC_DIR: './static/',
    STATIC_ROUTE_PREFIX: 'static',
    PORT: "3000",
    SILENT: false,
    ERROR_LOG_FILE_PATH: "./error.log",
    LOG_SIZE: "10M",
    DEBUG_LOG_FILE_PATH: "./debug.log",
    WATCH: false,
};

