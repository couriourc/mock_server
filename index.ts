import {startup} from "./src/core/startup.ts";
import {initLogger} from "./src/utils/logger.ts";
import {config, cwd} from "./src/core/config.ts";


// 配置优先级 argv > 文件 > 默认配置
// 读取配置文件，加载配置
initLogger({config});
// 加载插件模块
await startup(config, cwd);
