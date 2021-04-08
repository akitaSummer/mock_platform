import EventEmitter from "events";
import { rmdir } from "fs/promises";

class MyEmitter extends EventEmitter {}

export const myEmitter = new MyEmitter();

myEmitter.on("delTempDir", async (path: string) => {
  await rmdir(path);
  console.log("delTempDir");
});
