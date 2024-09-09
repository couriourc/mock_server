export interface IPlugin {
    name: string;
    execute: Function;
    option: any;
}
