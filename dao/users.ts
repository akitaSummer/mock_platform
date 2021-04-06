import { prop, getModelForClass } from "@typegoose/typegoose";

export class User {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public password!: string;

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

const UserModel = getModelForClass(User);

export const findUserById = async (id: string) => {
  return await UserModel.findById({ _id: id });
};

export const findUserByName = async (name: string) => {
  return await UserModel.findOne({ name });
};

export const createUser = async (name: string, password: string) => {
  return await UserModel.create({ name, password, deleted: 0 });
};
