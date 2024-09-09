import path from "path";
import fs from "fs";
import {Glob} from "bun";
import Elysia from "elysia";
import {Table} from "console-table-printer";
import {COLOR_MAPS} from "../constants";
import {pick} from "underscore";
import {safeRun} from "../utils";
import * as Mock from "mockjs";
import Mustache from "mustache";
import {staticPlugin} from "@elysiajs/static";
import chalk from "chalk";
import cluster from "cluster";
import process from "process";
import readline from "readline";
//@ts-ignore
import {logger as midLogger} from '@grotto/logysia';
import {initPlugins} from "./plugin-handler.ts";
import {checkAndInit} from "./config.ts";
import {getLogger} from "../utils/logger.ts";

export async function startup(config, cwd) {
    //
    const logger = getLogger();
    const resolve = (p?: string) => path.resolve(cwd(config.root_dir), p ?? '');

    // E 相关配置
    checkAndInit({resolve, config});
    const plugins = await initPlugins({config, resolve, logger});
    // S 打印日志配置
    // 遍历路径信息
    const glob = new Glob("./**/*.*");
    // 启动服务
    const app = new Elysia();
    const rewrites = config.rewrites.map(({path, test}) => {
        return [new RegExp(test), path];
    }) as [[RegExp, string]];

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
        const regBackets = /\[([^}]*)\]/g;

        const transformFile = (value: string) =>
            regBackets.test(value) ? value.replace(regBackets, (_, s) => `:${s}`) : value;
        const transformedFile = transformFile(path.basename(file));
        const withMethodParams = /(.*)\.(get|post|patch|head|delete|option|put)\.(.*)$/.exec(transformedFile);

        if (withMethodParams) {
            [_, url, method] = withMethodParams;
        } else {
            const route = transformedFile.split('.');
            url = route.slice(0, route.length - 1).join('/');
        }

        app.group(group.replaceAll(".", ""), (app) => {
            const finalUrl = urlRewrite(url, method,);
            app[method]?.(finalUrl, async (req) => {
                let res = Bun.file(resolve(path.join(config.api_dir, file)));
                logger.debug(JSON.stringify(pick(req, ['cookie', 'user-agent', 'headers', "params", 'body', 'route', 'query', 'content-type'])));
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
                logger.error(`Load plugin ${chalk.redBright.bold!(
                    plugin.name
                )} error: ${err.message}`);
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
            logger.debug(`new worker #${cluster.worker!?.id}`);
            process.on("SIGINT", () => {
                logger.debug(`[worker#${cluster.worker!?.id}] SIGINT received! dying gracefully!!\n`);
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

}
