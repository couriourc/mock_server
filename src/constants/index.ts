import type {IConfigParameter} from "../types";

export {default as COLOR_MAPS} from "./colors.ts";
export const DEFAULT_CONFIG: IConfigParameter = {
    ROOT_DIR: "example",
    API_DIR: 'apis',
    STATIC_DIR: 'static',
    PORT: "3000",
    SILENT: false,
    ERROR_LOG_FILE_PATH: "./error.log",
    LOG_SIZE: "10M",
    DEBUG_LOG_FILE_PATH: "./debug.log",
    WATCH: false,
};
