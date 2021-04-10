import { spawn } from "child_process";
import { join, dirname } from "path";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
  IdlUploadTaskStatusCode,
  HError,
  ModuleType,
} from "../../types";

import { changeStep } from "../../dao/tasks";

export const compileIDL = async (key: string) => {};
