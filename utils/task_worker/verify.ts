import { changeStep } from "../../dao/tasks";

import { existsSync, statSync } from "fs";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
  HError,
} from "../../types";

import { sendMessage } from "./utils";

import { IdlParser } from "./idl_compiler";

export const verifyFiles = async (key: string, path: string) => {
  try {
    await changeStep(key, IdlUploadTaskStep.Verify);

    // 验证path是否存在
    if (!existsSync(path)) {
      sendMessage(IdlUploadTaskStatus.UnexpectedExit, `${path} not exist`);
  
      throw new HError(`${path} not exist`, IdlUploadTaskStatusCode.VerifyFailed);
    }
  
    // 验证path是否是一个文件夹
    // 获取信息
    const stat = statSync(path);
    if (!stat.isDirectory()) {
      sendMessage(IdlUploadTaskStatus.UnexpectedExit, `${path} is not dir`);
  
      throw new HError(
        `${path} is not dir`,
        IdlUploadTaskStatusCode.VerifyFailed
      );
    }
  
    sendMessage(
      IdlUploadTaskStatus.Pending,
      ">> find index.thrift or service in ${path}"
    );
  
    const idlParser = new IdlParser(path);
    const rootPath = idlParser.getRoot()
  
    if (rootPath) {
        return rootPath
    }
  
    sendMessage(IdlUploadTaskStatus.UnexpectedExit, `cannot find an index.thrift or service in ${path}`)
  
    throw new HError(
        `cannot find an index.thrift or service in ${path}`,
        IdlUploadTaskStatusCode.VerifyFailed
    )
  } catch(e) {
      throw new HError(e.message, IdlUploadTaskStatusCode.VerifyFailed)
  }
};
