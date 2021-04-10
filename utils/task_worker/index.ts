import { resolve } from "path";
import { zip } from "compressing";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
  HError,
} from "../../types";

import { sendMessage } from "./utils";
import { verifyFiles } from "./verify";

const path = resolve(__dirname, `../../public/idls/temp/${process.env.id}`);

const taskInfo = JSON.parse(process.env.taskInfo) as IdlUploadTaskType;

const id = process.env.id;

const handlerWorker = async () => {
  // 解压
  sendMessage(IdlUploadTaskStatus.Pending, "> uncompress file");

  await zip
    .uncompress(resolve(path, `./${taskInfo.filename}`), resolve(path, `./idl`))
    .catch((err) => {
      return new HError(
        "uncompress failed",
        IdlUploadTaskStatusCode.UncompressFailed
      );
    });

  // 验证文件结构
  sendMessage(IdlUploadTaskStatus.Pending, "> verify file structs");
  const idlRoot = await verifyFiles(id, resolve(path, `./idl`));

  if (!idlRoot) {
    sendMessage(IdlUploadTaskStatus.UnexpectedExit, "> file verify failed");

    throw new HError(
      "file verify failed",
      IdlUploadTaskStatusCode.VerifyFailed
    );
  }

  sendMessage(IdlUploadTaskStatus.Pending, "> file verify success");

  // 编译
  sendMessage(IdlUploadTaskStatus.Pending, "> compile idl files");
};

handlerWorker();
