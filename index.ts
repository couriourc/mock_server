import {Glob} from "bun";
import * as process from "process";
import Elysia from 'elysia';
import * as path from "path";
import * as Mock from "mockjs";
import Mustache from "mustache";
import * as fs from "fs";
import Logger from "@ptkdev/logger";
import _, {pick} from "underscore";
import {program} from "commander";
import {mergeDeep} from "elysia/utils";
import {Table} from "console-table-printer";
import cluster from "cluster";
import readline from "readline";
import chalk from 'chalk';
import {staticPlugin} from '@elysiajs/static';
//@ts-ignore
import {logger as midLogger} from '@grotto/logysia';
import {safeRun} from "./src/utils";
import type {IConfigParameter} from "./src/types";
import {COLOR_MAPS, DEFAULT_CONFIG} from "./src/constants";
import yaml from "yaml";

const cwd = (...p: string[]) => path.resolve(process.cwd(), ...p);
// 配置优先级 argv > 文件 > 默认配置
// 读取配置文件，加载配置

// S 配置启动命令信息
program.option('-d, --debug', 'output extra debugging')
    .option('-r , --cwd <cwd>', 'cwd')
    .option('-p , --port <port>', 'server port')
    .option('-s , --silent <silent>', 'silent output')
    .option('-w , --watch <watch>', 'silent output')
    .option('-f , --static-dir <static-dir>', 'static dir')
    .option('-el , --error-log <error-log>', 'error log file path')
    .option('-dl , --debug-log <debug-log>', 'debug log file path')
    .option('-pl , --plugin-dir <plugin-dir>', 'plugin-dir file path')
    .option('-c , --config <config-file>', 'config file path')
;
const command = program.parse(process.argv);
// E 配置启动命令信息
const parsedConfig = yaml.parse<IConfigParameter>(await safeRun(() => {
        const configFilePath = cwd(command.getOptionValue('cwd') ?? DEFAULT_CONFIG.root_dir, command.getOptionValue('config') ?? "./.simple-mock.yaml");
        if (!fs.existsSync(configFilePath)) {
            return '';
        }
        return fs.readFileSync(configFilePath).toString();
    },
    // @ts-ignore
    ""
));

// S 相关配置
const choice = (cmd: any, parsed: any, defaultConfig: any) => {
    return cmd ??
    (_.isUndefined(parsed) || _.isNull(parsed)) ?
        defaultConfig :
        parsed;
};
const config = mergeDeep(DEFAULT_CONFIG, {
    port: choice(command.getOptionValue('port'), parsedConfig?.port, DEFAULT_CONFIG.port),
    silent: choice(command.getOptionValue("silent"), parsedConfig?.silent, DEFAULT_CONFIG.silent),
    error_log_file_path: choice(command.getOptionValue("error_log"), parsedConfig?.error_log_file_path, DEFAULT_CONFIG.error_log_file_path),
    debug_log_file_path: choice(command.getOptionValue("debug_log"), parsedConfig?.debug_log_file_path, DEFAULT_CONFIG.debug_log_file_path),
    watch: choice(command.getOptionValue("watch"), parsedConfig?.watch, DEFAULT_CONFIG.watch),
    static_dir: choice(command.getOptionValue("static-dir"), parsedConfig?.static_dir, DEFAULT_CONFIG.static_dir),
    static_route_prefix: choice(command.getOptionValue("static-route-prefix"), parsedConfig?.static_route_prefix, DEFAULT_CONFIG.static_route_prefix)
} as Partial<IConfigParameter>);
const resolve = (p?: string) => path.resolve(cwd(config.root_dir), p ?? '');

// E 相关配置

{
    // 创建默认配置文件夹
    if (!fs.existsSync(resolve(config.static_dir))) {
        fs.mkdirSync(resolve(config.static_dir));
    }
    if (!fs.existsSync(resolve(config.api_dir))) {
        fs.mkdirSync(resolve(config.api_dir));
    }
}

// S 打印日志配置
const plugins: ({
    name: string;
    execute: Function;
    option: any
}) [] = [];
const logger = new Logger({
    sponsor: !config.silent,
    info: !config.silent,
    debug: !config.silent,
    rotate: {
        size: config.log_size,
        encoding: "utf8",
    },
});

{
    // 加载插件
    const glob = new Glob("*/package.json");
    const resolvedPluginPath = resolve(config.plugin_dir);
    if (fs.existsSync(resolvedPluginPath)) {
        for await (const file of glob.scan(resolvedPluginPath)) {
            const plugin = await import(path.join(resolvedPluginPath, file));
            if (!plugin.main) {
                logger.error("Manifest need main field!");
            }
            const main = await import( path.resolve(path.dirname(path.resolve(resolvedPluginPath, file)), plugin.main));
            const enabled = parsedConfig?.plugins?.[plugin.name]?.enabled ?? true;
            if (!enabled) continue;
            if (typeof main.default === "function") {
                plugins.push({
                    name: plugin.name,
                    execute: main.default,
                    option: parsedConfig?.plugins?.[plugin.name] ?? {}
                });
            }
        }
    }
}
// 遍历路径信息
const glob = new Glob("./**/*.*");
// 启动服务
const app = new Elysia();
const rewrites = [
    [/^index$/, ''],
] as [[RegExp, string]];

const urlRewrite = (url: string, method: string) => {
    for (let [reg, final] of rewrites) {
        url = url.replace(reg, final);
    }
    return url;
};
// 记录路由表
const routeTable = new Table({
    columns: [
        {name: 'index', color: 'blue'},
        {name: 'url', alignment: 'left', color: 'blue'},
        {name: 'method', alignment: 'left',},
        {name: 'file', alignment: 'left', color: 'blue'},
    ],
    colorMap: {
        post: COLOR_MAPS.FgCyan,
        get: COLOR_MAPS.FgBlue,
        put: COLOR_MAPS.FgYellow,
        delete: COLOR_MAPS.FgRed,
        patch: COLOR_MAPS.FgMagenta,
        head: COLOR_MAPS.FgWhite,
        option: COLOR_MAPS.FgWhite,
    },
});
let apiLength = 0;
for await (const file of glob.scan(resolve(config.api_dir))) {
    let [_, url, method] = [undefined, '', 'get'];
    const group = path.normalize(path.parse(path.normalize(file)).dir).replaceAll(path.sep, '/');
    app.group(group.replaceAll(".", ""), (app) => {
        const withMethodParams = /(.*)\.(get|post|patch|head|delete|option|put)\.(.*)$/.exec(path.basename(file));
        if (withMethodParams) {
            [_, url, method] = withMethodParams;
        } else {
            url = path.basename(file).split('.')[0];
        }
        const finalUrl = urlRewrite(url, method,);
        app[method]?.(finalUrl, async (req) => {
            let res = Bun.file(resolve(path.join(config.api_dir, file)));
            logger.debug(JSON.stringify(pick(req, ['cookie', 'user-agent', 'headers', 'body', 'route', 'query', 'content-type'])));
            switch (path.extname(file)) {
                case ".json":
                    return safeRun(async () => Mock.mock(JSON.parse(Mustache.render(JSON.stringify(await res.json()) as string, req))), Promise.resolve(res));
                default:
                    return res;
            }
        });
        routeTable.addRow({
            index: ++apiLength,
            url: path.normalize(path.join(group, finalUrl || '/')).replaceAll(path.sep, '/'),
            method,
            file: path.normalize(path.relative(resolve(), resolve(path.join(config.api_dir, file))))
        }, {
            color: method
        });
        return app;
    });
}
//    logger.info(process.argv.shift())
config.watch && fs.watch(path.resolve(config.api_dir), async (event, filename) => {
    logger.warning(`${config.api_dir} has already changed,I Will Restart,Please wait a moment!!`);
    restart();
});
// 静态资源信息处理
await safeRun(() => {
    // @ts-ignore
    return app.use(staticPlugin({
        prefix: `${config.static_route_prefix}`, // prefix
        assets: resolve(config.static_dir),
        indexHTML: true,
        noCache: true,
        alwaysStatic: false // 文件动态获取信息
    }));
});
// 加载插件
{
    plugins.map((plugin) => {
        try {
            plugin.execute({app, logger, config, option: plugin.option});
        } catch (err) {
            /*@ts-ignore*/
            logger.error(`Load plugin ${chalk.redBright.bold(plugin.name)} error: ${err.message}`);
        }
    });
    logger.debug(`Loaded ${plugins.length} Plugin`);
}
// 监听
app.use(midLogger({
    logIP: false,
    writer: {
        write(msg: string) {
            logger.debug(msg);
        }
    }
}))
    .listen(~~config.port);
// 欢迎信息
// @ts-ignore
logger.info(`
> Hi,I'm SimpleMockServer, 
· Now dir configuration: 
| Root: ${chalk.white.bold(resolve(""))}  
| api_dir: ${chalk.white.bold(resolve(config.api_dir))}
| static_dir: ${chalk.white.bold(resolve(config.static_dir))}
· Now Server: 
| ServerApi: running on http://localhost:${config.port}
| StaticFile: running on http://localhost:${config.port}/${config.static_route_prefix}
· Tips: 
| Restart: Press key ${chalk.redBright.bold('R')}
| Exit: Press key ${chalk.redBright.bold('Q')}
`);
routeTable.printTable();

function restart() {
    if (cluster.isMaster ?? cluster.isPrimary) {
        cluster.fork();
        cluster.on("exit", (worker, code) => {
            logger.debug(`[master] worker #${worker.id} down, restarting`);
            cluster.fork();
        });
        process.on("SIGINT", () => {
        });
    } else {
        logger.debug(`new worker #${cluster.worker.id}`);
        process.on("SIGINT", () => {
            logger.debug(`[worker#${cluster.worker.id}] SIGINT received! dying gracefully!!\n`);
            process.exit(0);
        });
    }
}

// 拦截
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
// 监听事件
process.stdin.on('keypress', (str) => {
    str = str?.toLowerCase?.();
    switch (str) {
        //按r重启
        case 'r':
            restart();
            break;
        //按d退出
        case 'q':
            process.exit(0);
            break;
    }
});
