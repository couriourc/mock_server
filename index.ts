import {Glob} from "bun";
import * as process from "process";
import Elysia from 'elysia';
import * as path from "path";
import {extractFunctionOrValue, safeRun} from "./utils.ts";
import * as Mock from "mockjs";
import Mustache from "mustache";
import dotenv from 'dotenv';
import * as fs from "fs";
import Logger from "@ptkdev/logger";
import {pick} from "underscore";

const resolve = (p?: string) => path.resolve(process.cwd(), p ?? '');
// 读取配置文件，加载配置
const config = dotenv.parse(safeRun(() => fs.readFileSync(resolve("./.simple-mock")), Buffer.from(`
API_DIR=example
PORT=3000
LOG_SIZE=10M
`)));

// 打印日志
const logger = new Logger({
    write: true,
    sponsor: true,
    rotate: {
        size: config.LOG_SIZE as any,
        encoding: "utf8",
    },
    path: {
        // remember: add string *.log to .gitignore
        debug_log: resolve("./debug.log"),
        error_log: resolve("./errors.log"),
    },
});

const glob = new Glob("./**/*.*");

const app = new Elysia();
const rewrites = [
    [/^index$/, ''],
] as [[RegExp, string]];

const urlRewrite = (url: string, method: string) => {
    let result = url;
    for (let [reg, final] of rewrites) {
        if (reg.test(url)) {
            return extractFunctionOrValue(final, url, method);
        }
    }
    return result;
};
const routeTable = [];

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
        app[method](finalUrl, async (req) => {
            let res = Bun.file(resolve(path.join(config.API_DIR, file)));
            logger.debug(JSON.stringify(pick(req, ['cookie', 'user-agent', 'headers', 'body', 'route', 'query', 'content-type'])));
            switch (path.extname(file)) {
                case ".json":
                    return safeRun(async () => Mock.mock(JSON.parse(Mustache.render(JSON.stringify(await res.json()) as string, req))), Promise.resolve(res));
                default:
                    return res;
            }
        });
        routeTable.push({
            url: path.normalize(path.join(group, finalUrl || '/')).replaceAll(path.sep, '/'),
            method,
            file: path.normalize(path.relative(resolve(), resolve(path.join(config.API_DIR, file))))
        });
        return app;
    });
}

fs.watch(path.resolve(config.API_DIR,), async (event, filename) => {
    logger.warning(`${config.API_DIR} has already changed,you should restart me!!`);
});
app.listen(~~config.PORT);

logger.info(`SimpleMockServer running on http://localhost:${config.PORT}`);
console.table(routeTable);
