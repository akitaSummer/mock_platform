import { spawn } from "child_process";
import { join, dirname } from "path";

import { existsSync, statSync } from "fs";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
  HError,
  ModuleType,
} from "../../types";

import { changeStep } from "../../dao/tasks";

import {
  sendMessage,
  CompiledRoot,
  copyFile,
  isDir,
  isFile,
  mkdir,
} from "./utils";

const findBin = (path: string) => {
  if (path === "/" || !path) return "";

  const dest = join(path, ".bin");

  if (existsSync(dest)) {
    const stat = statSync(dest);
    if (stat.isDirectory()) return dest;
  }

  return findBin(dirname(path));
};

const idEmptyArr = <T>(arr: T[]) => !Array.isArray(arr) || arr.length === 0;

const runShell = (command: string, args?: readonly string[]) => {
  return new Promise((resolve, reject) => {
    const worker = spawn(command, args);

    const logs: string[] = [];

    let commandStr = command;

    if (Array.isArray(args) && args.length > 0) {
      commandStr = `${commandStr} ` + args.join(" ");
    }

    worker.stdout.on("data", (data) => {
      const logStr: string = data.toString();
      sendMessage(IdlUploadTaskStatus.Pending, logStr);
      logs.push(logStr);
    });

    worker.stderr.on("data", (data) => {
      const errStr = data.toString();
      sendMessage(IdlUploadTaskStatus.Pending, errStr);
      logs.push(errStr);
    });

    worker.on("close", (code) => {
      sendMessage(IdlUploadTaskStatus.Pending, `>> closed at ${code}`);

      if (code === 0) {
        resolve(logs.join(""));
      } else {
        reject(new Error(logs.join("")));
      }
    });
  });
};

export const compileIDL = async (key: string, src: string) => {
  await changeStep(key, IdlUploadTaskStep.Compile);

  mkdir(CompiledRoot);
  const dest = join(CompiledRoot, "idls");
  mkdir(dest);

  const binPath = findBin(__dirname);
  if (!isDir(binPath)) {
    sendMessage(IdlUploadTaskStatus.UnexpectedExit, "cannot find .bin");

    throw new HError("cannot find .bin", IdlUploadTaskStatusCode.CompileFailed);
  }

  const thrifyPath = join(binPath, "thrift");

  if (!isFile(thrifyPath)) {
    sendMessage(IdlUploadTaskStatus.UnexpectedExit, "cannot find .bin/thrift");

    throw new HError(
      "cannot find ,bin/thrift",
      IdlUploadTaskStatusCode.CompileFailed
    );
  }

  const autogqlPath = join(binPath, "autogql");

  if (!isFile(autogqlPath)) {
    sendMessage(IdlUploadTaskStatus.UnexpectedExit, "cannot find .bin/autogql");

    throw new HError(
      "cannot find .bin/autogql",
      IdlUploadTaskStatusCode.CompileFailed
    );
  }

  try {
    const indexThriftPath = join(src, "index.thrift");

    sendMessage(
      IdlUploadTaskStatus.Pending,
      `>> thrift -r -o ${dest} --gen js:node ${indexThriftPath}`
    );

    await runShell(thrifyPath, [
      "-r",
      "-o",
      dest,
      "--gen",
      "js:node",
      indexThriftPath,
    ]);

    sendMessage(
      IdlUploadTaskStatus.Pending,
      `>> thrift -r -o ${dest} --gen json:merge ${indexThriftPath}`
    );

    await runShell(thrifyPath, [
      "-r",
      "-o",
      dest,
      "--gen",
      "json:merge",
      indexThriftPath,
    ]);

    // autogql ./service/caijing.fe.gateway_dashboard ./service/caijing.fe.gateway_dashboard/gen-json
    const genGqlPath = join(dest, "gen-gql");
    const genJsonPath = join(dest, "gen-json");

    sendMessage(
      IdlUploadTaskStatus.Pending,
      `>> autogql ${genGqlPath} ${genJsonPath}`
    );

    await runShell(autogqlPath, [genGqlPath, genJsonPath]);

    // 编译idl
    sendMessage(IdlUploadTaskStatus.Pending, ">> Analyzing thrift files...");
    sendMessage(IdlUploadTaskStatus.Pending, ">> Create TS files...");
  } catch (err) {
    throw new HError(err.message, IdlUploadTaskStatusCode.CompileFailed);
  }
};
