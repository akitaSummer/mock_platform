import { zip } from "compressing";

import {
  IdlUploadTaskType,
  IdlUploadTaskStep,
  IdlUploadTaskStatus,
} from "../../types";
import { sendMessage } from "./";

export const uncompressFile = async (path: string, file: string) => {
  await zip.uncompress(file, path);
};
