import {Glob} from "bun";
import fs from "fs";
import path from "path";
import type {IPlugin} from "../presets/plugins";
import {presetPlugins} from "../presets";

const plugins: Array<IPlugin> = [...presetPlugins];

//    const plugins: () [] = [];

async function loadPlugins(resolvedPluginPath, config, glob, logger) {

    if (fs.existsSync(resolvedPluginPath)) {
        for await (const file of glob.scan(resolvedPluginPath)) {
            const plugin = await import(path.join(resolvedPluginPath, file));
            if (!plugin.main) {
                logger.error("Manifest need main field!");
            }
            const main = await import( path.resolve(path.dirname(path.resolve(resolvedPluginPath, file)), plugin.main));
            const enabled = config.plugins?.[plugin.name]?.enabled ?? true;
            if (!enabled) continue;
            if (typeof main.default === "function") {
                plugins.push({
                    name: plugin.name,
                    execute: main.default,
                    option: config.plugins?.[plugin.name] ?? {}
                });
            }
        }
    }
}

export async function initPlugins({
                                      config,
                                      resolve,
                                      logger
                                  }) {

    // load plugins
    const glob = new Glob("*/package.json");
    // set config
    const resolvedPluginPath = resolve(config.plugin_dir);
    for (const plugin of plugins) {
        const enabled = config.plugins?.[plugin.name]?.enabled ?? true;
        if (!enabled) continue;
        plugin.option = config.plugins?.[plugin.name] ?? {};
    }
    // load local plugins
    await loadPlugins(resolvedPluginPath, config, glob, logger);
    const sets = new Set<string>();
    for (const plugin of plugins) {
        if (sets.has(plugin.name)) {
            logger.warning("plugin: " + plugin.name + " may be redundant");
            continue;
        }
        sets.add(plugin.name);
    }
    return plugins;
}

export function getPlugins() {
    return plugins;
}
