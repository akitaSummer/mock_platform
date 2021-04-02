import { prop, getModelForClass } from "@typegoose/typegoose";

class User {
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

export const findUserByName = async (name: string) => {
    return await UserModel.find({ name })
}

export const createUser = async (name: string, password: string) => {
  return await UserModel.create({ name, password, deleted: 0 });
};
