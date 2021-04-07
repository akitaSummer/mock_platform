import { Router } from "express";
import { resolve } from "path";
import multer from "multer";
import {
  findIdlByUserIdAndProjectName,
  updateIdl,
  createIdl,
} from "../dao/idls";

import {
  Request,
  Response,
  StatusCode,
  RespError,
  handleError,
} from "../types";

const idlRouter = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resolve(__dirname, "../public/idls/"));
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
  async (req: Request & { file: Express.Multer.File }, res: Response) => {
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
        throw new RespError(StatusCode.UpdateFailed, "update idl failed");

      res.send({
        data: {
          StatusCode: StatusCode.Success,
          StatusMessage: "create success",
          data: {
            file,
            url: `http://localhost:4000/public/idls/${file.filename}`,
          },
        },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

idlRouter.post(
  "/upload/:project",
  upload.single("file"),
  async (req: Request & { file: Express.Multer.File }, res: Response) => {
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

      res.send({
        data: {
          StatusCode: StatusCode.Success,
          StatusMessage: "upload success",
          data: {
            file,
            url: `http://localhost:4000/public/idls/${file.filename}`,
          },
        },
      });
    } catch (e) {
      handleError(e, res);
    }
  }
);

export default idlRouter;
