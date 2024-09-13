import Cors from "@elysiajs/cors";
/*@ts-ignore*/
import {logger as midLogger} from '@grotto/logysia';


export default function ({app, logger, option}) {
    app.use(midLogger({
        logIP: false,
        writer: {
            write(msg: string) {
                logger.debug(msg);
            }
        },
        ...(option ?? {})
    }));
}
