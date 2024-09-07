import {Glob} from "bun";
import * as process from "process";
import Elysia from 'elysia';
import * as path from "path";
import {safeRun} from "./src/utils";
import * as Mock from "mockjs";
import Mustache from "mustache";
import dotenv from 'dotenv';
import * as fs from "fs";
import Logger from "@ptkdev/logger";
import {pick} from "underscore";
import {program} from "commander";
import {mergeDeep} from "elysia/utils";
import {Table} from "console-table-printer";
import type {IConfigParameter} from "./src/types";
import {COLOR_MAPS, DEFAULT_CONFIG} from "./src/constants";
import cluster from "cluster";
import readline from "readline";
import chalk from 'chalk';
import {staticPlugin} from '@elysiajs/static';

const cwd = (p?: string) => path.resolve(process.cwd(), p ?? '');
// 配置优先级 argv > 文件 > 默认配置
// 读取配置文件，加载配置
const parsedConfig = dotenv.parse<IConfigParameter>(await safeRun(() => fs.readFileSync(cwd("./.simple-mock")), await Buffer.from('')));
// S 配置启动命令信息
program.option('-d, --debug', 'output extra debugging', true)
    .option('-p , --port <port>', 'server port', "3000")
    .option('-s , --silent <silent>', 'silent output', false)
    .option('-w , --watch <watch>', 'silent output', false)
    .option('-f , --static-dir <static-dir>', 'static dir', false)
    .option('-el , --error-log <error-log>', 'error log file path', "./error.log")
    .option('-dl , --debug-log <debug-log>', 'debug log file path', "./debug.log");
program.parse(process.argv);
// E 配置启动命令信息


// S 相关配置
const config = mergeDeep(DEFAULT_CONFIG, {
    PORT: (program as IConfigParameter)['port'] ?? parsedConfig?.PORT ?? DEFAULT_CONFIG.PORT,
    SILENT: (program as IConfigParameter)['silent'] ?? parsedConfig?.SILENT ?? DEFAULT_CONFIG.SILENT,
    ERROR_LOG_FILE_PATH: program['error_log'] ?? parsedConfig?.ERROR_LOG_FILE_PATH ?? DEFAULT_CONFIG.ERROR_LOG_FILE_PATH,
    DEBUG_LOG_FILE_PATH: program['debug_log'] ?? parsedConfig?.DEBUG_LOG_FILE_PATH ?? DEFAULT_CONFIG.DEBUG_LOG_FILE_PATH,
    WATCH: program['watch'] ?? parsedConfig?.WATCH ?? DEFAULT_CONFIG.WATCH,
    STATIC_DIR: program['static-dir'] ?? parsedConfig?.STATIC_DIR ?? DEFAULT_CONFIG.STATIC_DIR,
    STATIC_ROUTE_PREFIX: program['static-route-prefix'] ?? parsedConfig?.STATIC_ROUTE_PREFIX ?? DEFAULT_CONFIG.STATIC_ROUTE_PREFIX
} as Partial<IConfigParameter>);

const resolve = (p?: string) => path.resolve(cwd(config.ROOT_DIR), p ?? '');

// E 相关配置
// S 打印日志配置

const logger = new Logger({
    sponsor: !config.SILENT,
    info: !config.SILENT,
    debug: !config.SILENT,
    rotate: {
        size: config.LOG_SIZE,
        encoding: "utf8",
    },
});
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
for await (const file of glob.scan(resolve(config.API_DIR))) {
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
            let res = Bun.file(resolve(path.join(config.API_DIR, file)));
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
            file: path.normalize(path.relative(resolve(), resolve(path.join(config.API_DIR, file))))
        }, {
            color: method
        });
        return app;
    });
}
//    logger.info(process.argv.shift())
config.WATCH && fs.watch(path.resolve(config.API_DIR,), async (event, filename) => {
    logger.warning(`${config.API_DIR} has already changed,I Will Restart,Please wait a moment!!`);
    restart();
});
// 静态资源信息处理
await safeRun(() => {
    // @ts-ignore
    return app.use(staticPlugin({
        prefix: `${config.STATIC_ROUTE_PREFIX}`, // prefix
        assets: resolve(config.STATIC_DIR),
        indexHTML: true,
        noCache: true,
    }));
});
// 监听
app.listen(~~config.PORT);
// 欢迎信息
// @ts-ignore
logger.info(`
> Hi,I'm SimpleMockServer, 
· Now dir configuration: 
| Root: ${chalk.white.bold(resolve(""))}  
| API_DIR: ${chalk.white.bold(resolve(config.API_DIR))}
| STATIC_DIR: ${chalk.white.bold(resolve(config.STATIC_DIR))}
· Now Server: 
| ServerApi: running on http://localhost:${config.PORT}
| StaticFile: running on http://localhost:${config.PORT}/${config.STATIC_ROUTE_PREFIX}
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


readline.emitKeypressEvents(process.stdin);
// 监听重新加载
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    str = str.toLowerCase();
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
