import { join } from "path";
import { tmpdir } from "os";
import {
  existsSync,
  statSync,
  unlinkSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
} from "fs";
import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
  HError,
} from "../../types";

export const sendMessage = (status: IdlUploadTaskStatus, log: string) => {
  if (status === IdlUploadTaskStatus.UnexpectedExit) {
    log = `ERROR ${log}`;
  } else {
    log = `INFO ${log}`;
  }

  process.send(log);
};

export const getTmpDir = () => tmpdir();

export const CompiledRoot = join(getTmpDir(), "idl-compliled");

export const isDir = (path: string) => {
  if (!existsSync(path)) return false;
  const stat = statSync(path);
  return stat.isDirectory();
};

export const isFile = (path: string) => {
  if (!existsSync(path)) return false;
  const stat = statSync(path);
  return stat.isFile;
};

export const mkdir = (path: string) => {
  if (existsSync(path)) {
    const stat = statSync(path);
    if (!stat.isDirectory()) {
      unlinkSync(path);
    }
  }

  mkdirSync(path, { recursive: true });
};

export const copyFile = (src: string, dest: string) => {
  const stat = statSync(src);
  if (stat.isDirectory()) {
    mkdir(dest);

    const files = readdirSync(src);
    files.forEach((item) => {
      const itemSrc = join(src, item);
      const itemDest = join(dest, item);

      copyFile(itemSrc, itemDest);
    });
  } else {
    copyFileSync(src, dest);
  }
};
