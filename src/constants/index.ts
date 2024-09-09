import type {IConfigParameter} from "../types";
import * as process from "process";

export {default as COLOR_MAPS} from "./colors.ts";

export const DEFAULT_CONFIG: IConfigParameter = {
    root_dir: process.env.NODE_ENV === "development" ? "example" : ".",
    api_dir: 'apis',
    static_dir: './static/',
    static_route_prefix: 'static',
    port: "3000",
    silent: false,
    error_log_file_path: "./error.log",
    log_size: "10M",
    debug_log_file_path: "./debug.log",
    watch: false,
    plugin_dir: "./plugins",
    plugins: {}
};

export const DEFAULT_MOCK_YAML_CONFIG = `
root_dir: .
api_dir: apis
static_dir: static
static_route_prefix: /
port: 3000
silent:
error_log_file_path: ./error.log
log_size: 10M
debug_log_file_path: ./debug.log
watch:
plugins:
  swagger:
rewrites:
  - path: ''
    test: ^(index)$
`

