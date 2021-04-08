import { prop, getModelForClass } from "@typegoose/typegoose";
import { rmdir } from "fs/promises";
import { resolve } from "path";

export enum IdlStatus {
  NotRun = 0,
  Running = 1,
  Success = 2,
  Error = 3,
}

export class Idl {
  @prop({ required: true })
  public userId!: string;

  @prop({ required: true })
  public projectName!: string;

  @prop({ required: true })
  public filename!: string;

  @prop({ required: true })
  public status!: IdlStatus;

  @prop({
    default: 0,
    validate: {
      validator: (v) => {
        return v === 0 || v === 1;
      },
      message: "deleted only is 0 or 1!",
    },
  })
  public deleted!: number;
}

const IdlModel = getModelForClass(Idl);

export const findIdlByUserIdAndProjectName = async (
  userId: string,
  projectName: string
) => {
  return await IdlModel.findOne({ userId, projectName, deleted: 0 });
};

export const createIdl = async (
  userId: string,
  projectName: string,
  filename: string
) => {
  return await IdlModel.create({
    userId,
    projectName,
    filename,
    status: IdlStatus.NotRun,
    deleted: 0,
  });
};

export const updateIdl = async (
  userId: string,
  projectName: string,
  newFilename: string
) => {
  await IdlModel.findOne({ userId, projectName, deleted: 0 }, (err, res) => {
    if (err) throw err;
    if (!res) return;
    // 更新时，先将旧版本文件夹删除
    rmdir(resolve(__dirname, `../public/idls/${res.filename.split(".")[0]}`));
    res.deleted = 1;
    res.save();
  });
  return await createIdl(userId, projectName, newFilename);
};

export const updateIdlStatus = async (
  userId: string,
  projectName: string,
  status: IdlStatus
) => {
  return await IdlModel.findOne(
    { userId, projectName, deleted: 0 },
    (err, res) => {
      if (err) throw err;
      res.status = status;
      res.save();
    }
  );
};
