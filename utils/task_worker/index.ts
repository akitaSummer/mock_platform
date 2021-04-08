import { resolve } from "path";
import { zip } from "compressing";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
} from "../../types";

const path = resolve(__dirname, `../../public/idls/temp/${process.env.id}`);

const taskInfo = JSON.parse(process.env.taskInfo) as IdlUploadTaskType;

export class HError extends Error {
  public code: IdlUploadTaskStatusCode;

  constructor(message: string, code: IdlUploadTaskStatusCode) {
    super(message);
    this.code = code;
  }
}

export const sendMessage = (status: IdlUploadTaskStatus, log: string) => {
  if (status === IdlUploadTaskStatus.UnexpectedExit) {
    log = `ERROR ${log}`;
  } else {
    log = `INFO ${log}`;
  }

  process.send(log);
};

const handlerWorker = async () => {
  // 解压
  sendMessage(IdlUploadTaskStatus.Pending, "> uncompress file");

  await zip
    .uncompress(resolve(path, `./${taskInfo.filename}`), path)
    .catch((err) => {
      return new HError(
        "uncompress failed",
        IdlUploadTaskStatusCode.UncompressFailed
      );
    });

  // 验证文件结构
  sendMessage(IdlUploadTaskStatus.Pending, "> verify file structs");
};

handlerWorker();
