import fs from "fs";
import {program} from "commander";
import process from "process";
import path from "path";
import yaml from "yaml";
import type {IConfigParameter} from "../types";
import {safeRun} from "../utils";
import {DEFAULT_CONFIG, DEFAULT_MOCK_YAML_CONFIG} from "../constants";
import _ from "underscore";
import {mergeDeep} from "elysia/utils";

export function checkAndInit({resolve, config}) {
    {
        // 创建默认配置文件夹
        if (!fs.existsSync(resolve(config.static_dir))) {
            fs.mkdirSync(resolve(config.static_dir));
        }
        if (!fs.existsSync(resolve(config.api_dir))) {
            fs.mkdirSync(resolve(config.api_dir));
        }
    }
}


// S 配置启动命令信息
program.option('-d, --debug', 'output extra debugging')
    .option('-cw, --cwd <cwd>', 'cwd')
    .option('-p , --port <port>', 'server port')
    .option('-s , --silent <silent>', 'silent output')
    .option('-w , --watch <watch>', 'silent output')
    .option('-f , --static-dir <static-dir>', 'static dir')
    .option('-el , --error-log <error-log>', 'error log file path')
    .option('-dl , --debug-log <debug-log>', 'debug log file path')
    .option('-pl , --plugin-dir <plugin-dir>', 'plugin-dir file path')
    .option('-c , --config <config-file>', 'config file path');
const command = program.parse(process.argv);
const configFile = command.getOptionValue('config') ?? "./.simple-mock.yaml";
export const cwd = (...p: string[]) => path.resolve(command.getOptionValue('cwd') ?? process.cwd(), ...p);
// E 配置启动命令信息
const parsedConfig = yaml.parse<IConfigParameter>(await safeRun(() => {
        const configFilePath = cwd(DEFAULT_CONFIG.root_dir, configFile);
        if (!fs.existsSync(configFilePath)) {
            console.warn(`Not Found config file,Create ${configFilePath}`);
            fs.writeFileSync(configFilePath, DEFAULT_MOCK_YAML_CONFIG);
        }
        return fs.readFileSync(configFilePath).toString();
    },
    ""
));

// S 相关配置
const choice = (cmd: any, parsed: any, defaultConfig: any) => {
    return cmd ??
    (_.isUndefined(parsed) || _.isNull(parsed)) ?
        defaultConfig :
        parsed;
};
export const config = mergeDeep(DEFAULT_CONFIG, {
    port: choice(command.getOptionValue('port'), parsedConfig?.port, DEFAULT_CONFIG.port),
    silent: choice(command.getOptionValue("silent"), parsedConfig?.silent, DEFAULT_CONFIG.silent),
    error_log_file_path: choice(command.getOptionValue("error_log"), parsedConfig?.error_log_file_path, DEFAULT_CONFIG.error_log_file_path),
    debug_log_file_path: choice(command.getOptionValue("debug_log"), parsedConfig?.debug_log_file_path, DEFAULT_CONFIG.debug_log_file_path),
    watch: choice(command.getOptionValue("watch"), parsedConfig?.watch, DEFAULT_CONFIG.watch),
    static_dir: choice(command.getOptionValue("static-dir"), parsedConfig?.static_dir, DEFAULT_CONFIG.static_dir),
    static_route_prefix: choice(command.getOptionValue("static-route-prefix"), parsedConfig?.static_route_prefix, DEFAULT_CONFIG.static_route_prefix),
    plugins: parsedConfig?.plugins ?? {},
    rewrites: parsedConfig?.rewrites ?? {}
} as Partial<IConfigParameter>);
