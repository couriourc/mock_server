import {Glob} from "bun";
import * as process from "process";
import Elysia from 'elysia';
import * as path from "path";

const glob = new Glob("./example/config/**/*.json");

const app = new Elysia();
for await (const file of glob.scan(
    {
        cwd: process.cwd(),
    })) {
    let [_, url, method] = [undefined, '/', 'get'];
    const withMethodParams = /(.*)\.(get|post|patch|head|delete|option|put)\.json$/.exec(path.basename(file));
    if (withMethodParams) {
        [_, url, method] = withMethodParams;
        if (url === 'index') {
            url = '/';
        }
    } else {

        url = path.basename(file).split('.')[0];
        if (url === 'index') {
            url = '/';
        } else {
            url = `/${url}`;
        }
    }
    app[method](url, () => Bun.file(path.resolve(process.cwd(), file)));
    console.log(method, url, file);
}
app.listen(3000);
