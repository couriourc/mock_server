import Logger from "@ptkdev/logger";

let logger;

export function initLogger({config}) {
    logger =new Logger({
        sponsor: !config.silent,
        info: !config.silent,
        debug: !config.silent,
        rotate: {
            size: config.log_size,
            encoding: "utf8",
        },
    })
}


export function getLogger(){
    return logger;
}
