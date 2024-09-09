export interface IConfigParameter {
    log_size: "10B" | "10K" | "10M" | "10G";
    port: string;
    silent: boolean;
    error_log_file_path: string;
    debug_log_file_path: string;
    watch: boolean;
    root_dir: string;
    api_dir: string;
    static_dir: string;
    static_route_prefix: string;
    plugin_dir: string;
    plugins: Record<string, any>;
}
