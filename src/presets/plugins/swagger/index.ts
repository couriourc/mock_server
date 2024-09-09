import {swagger} from '@elysiajs/swagger';

export default function ({app, option}) {
    app.use(swagger({
        ...(option ?? {}),
    }));
}
