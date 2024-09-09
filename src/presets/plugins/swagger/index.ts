import {swagger} from '@elysiajs/swagger';

export default function ({app, option}) {
    console.log(option);
    app.use(swagger({
        ...(option ?? {}),
    }));
}
