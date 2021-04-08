import getRedis from "../db/redis";
import {
  IdlUploadTaskType,
  IdlUploadTaskStatus,
  IdlUploadTaskStep,
} from "../types";
import { myEmitter } from "../utils";

const mainKey = "upload_task";

export const getTaskInfo = async (key: string) => {
  try {
    const redis = await getRedis();

    const infoStr = await redis.hget(mainKey, key);

    if (infoStr) return JSON.parse(infoStr) as IdlUploadTaskType;

    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const setTaskInfo = async (key: string, taskInfo: IdlUploadTaskType) => {
  try {
    const redis = getRedis();
    await redis.hset(mainKey, key, JSON.stringify(taskInfo), "EX", 300);

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const clearTaskInfo = async (key: string) => {
  try {
    const redis = getRedis();
    await redis.hset(mainKey, key);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const changeStep = async (key: string, step: IdlUploadTaskStep) => {
  try {
    const taskInfo = await getTaskInfo(key);

    if (taskInfo) {
      taskInfo.step = step;

      return setTaskInfo(key, taskInfo);
    }

    return false;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const createTasks = async (
  key: string,
  userName: string,
  userId: string,
  projectName: string,
  filename: string,
  tempDir: string
) => {
  const task: IdlUploadTaskType = {
    userName,
    userId,
    projectName,
    filename,
    temp: tempDir,
    status: IdlUploadTaskStatus.Pending,
    step: IdlUploadTaskStep.Waiting,
  };

  const result = setTaskInfo(key, task);
  const I = result
    ? setTimeout(() => {
        myEmitter.emit("delTempDir", tempDir);
        I && clearTimeout(I);
      }, 300000)
    : null;

  return I;
};
