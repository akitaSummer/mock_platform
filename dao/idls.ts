import { prop, getModelForClass } from "@typegoose/typegoose";

export class Idl {
  @prop({ required: true })
  public userId!: string;

  @prop({ required: true })
  public projectName!: string;

  @prop()
  public filename!: string;

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
  return await IdlModel.create({ userId, projectName, filename, deleted: 0 });
};

export const updateIdl = async (
  userId: string,
  projectName: string,
  newFilename: string
) => {
  await IdlModel.findOneAndUpdate(
    { userId, projectName, deleted: 0 },
    { deleted: 1 }
  );
  return await createIdl(userId, projectName, newFilename);
};
