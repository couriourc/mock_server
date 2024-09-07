export interface IConfigParameter {
    LOG_SIZE: "10B" | "10K" | "10M" | "10G";
    PORT: string;
    SILENT: boolean;

    ERROR_LOG_FILE_PATH: string;
    DEBUG_LOG_FILE_PATH: string;

    WATCH: boolean;

    ROOT_DIR: string;
    API_DIR: string;
    STATIC_DIR: string;
    STATIC_ROUTE_PREFIX: string;
}
