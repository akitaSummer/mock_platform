import { Map } from "typescript";

export * from "./eventEmitter";

export const taskTimeOutMap: globalThis.Map<string, NodeJS.Timeout> = new Map();
