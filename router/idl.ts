import { Router } from "express";
import { resolve } from "path";
import { mkdirSync } from "fs";
import { rmdir } from "fs/promises";
import multer from "multer";

import { findIdlByUserIdAndProjectName, updateIdl } from "../dao/idls";
import { createTasks } from "../dao/tasks";
import {
  Request,
  Response,
  StatusCode,
  RespError,
  handleError,
} from "../types";
import { taskTimeOutMap } from "../utils";

const idlRouter = Router();

const storage = multer.diskStorage({
  destination: function (req: Request & { fileTempPath: string }, file, cb) {
    // 设定临时文件夹，待解压构建完成后存放至/public/idls/文件夹下
    const tempDir = Date.now().toString();
    const path = resolve(__dirname, `../public/idls/temp/${tempDir}`);
    mkdirSync(path, {
      recursive: true,
    });
    req.fileTempPath = tempDir;
    cb(null, path);
  },
  filename: function (req: Request, file, cb) {
    console.log(file);
    cb(null, `${req.user.name}_${req.params.project}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // 只储存rar或zip文件
    if (new RegExp(".[(rar)|(zip)]").test(file.originalname)) {
      cb(null, true);
    } else {
      cb(
        new RespError(
          StatusCode.FileTypeError,
          "upload file type is rar or zip"
        )
      );
    }
  },
});

idlRouter.post(
  "/create/:project",
  upload.single("file"),
  async (
    req: Request & { file: Express.Multer.File; fileTempPath: string },
    res: Response
  ) => {
    try {
      const { file, user, params } = req;
      if (!file.originalname)
        throw new RespError(StatusCode.TargetNotExist, "file is not exist");

      const { project } = params;
      if (!project)
        throw new RespError(StatusCode.TargetNotExist, "project is not exist");

      const idl = await findIdlByUserIdAndProjectName(req.user._id, project);
      if (idl) throw new RespError(StatusCode.TargetExist, "project is exist");

      const newIdl = await updateIdl(user._id, project, file.filename);

      if (!newIdl)
        throw new RespError(StatusCode.CreateFailed, "create idl failed");

      const result = await createTasks(
        req.fileTempPath,
        user.name,
        user._id,
        project,
        file.filename,
        req.fileTempPath
      );

      if (!result)
        throw new RespError(StatusCode.CreateFailed, "create idl task failed");

      taskTimeOutMap.set(req.fileTempPath, result);

      res.send({
        data: {
          StatusCode: StatusCode.Success,
          StatusMessage: "create success",
          data: {
            file,
            wsKey: req.fileTempPath,
          },
        },
      });
    } catch (e) {
      handleError(e, res);
      // 出现错误删除临时文件夹
      rmdir(req.fileTempPath);
    }
  }
);

idlRouter.post(
  "/upload/:project",
  upload.single("file"),
  async (
    req: Request & { file: Express.Multer.File; fileTempPath: string },
    res: Response
  ) => {
    try {
      const { file, user, params } = req;
      if (!file.originalname)
        throw new RespError(StatusCode.TargetNotExist, "file is not exist");

      const { project } = params;
      if (!project)
        throw new RespError(StatusCode.TargetNotExist, "project is not exist");

      const idl = await findIdlByUserIdAndProjectName(req.user._id, project);
      if (!idl)
        throw new RespError(StatusCode.TargetNotExist, "project not exist");

      const newIdl = await updateIdl(user._id, project, file.filename);

      if (!newIdl)
        throw new RespError(StatusCode.UpdateFailed, "update idl failed");

      const result = await createTasks(
        req.fileTempPath,
        user.name,
        user._id,
        project,
        file.filename,
        req.fileTempPath
      );

      if (!result)
        throw new RespError(StatusCode.CreateFailed, "create idl task failed");

      taskTimeOutMap.set(req.fileTempPath, result);

      res.send({
        data: {
          StatusCode: StatusCode.Success,
          StatusMessage: "upload success",
          data: {
            file,
            wsKey: req.fileTempPath,
          },
        },
      });
    } catch (e) {
      handleError(e, res);
      rmdir(req.fileTempPath);
    }
  }
);

export default idlRouter;
