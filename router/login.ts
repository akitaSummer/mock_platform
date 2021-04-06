import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Router } from "express";

import { Request, Response, StatusCode } from "../types";
import { findUserByName, createUser } from "../dao/users";

const loginRouter = Router();

class LoginError extends Error {
  public code: StatusCode;
  public message: string;

  constructor(code: StatusCode, message: string) {
    super();
    this.code = code;
    this.message = message;
  }
}

const isLoginError = (e: any): e is LoginError => {
  return e && e.code;
};

loginRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    // 1. 根据用户名查找用户
    const user = await findUserByName(username);
    if (!user) throw new LoginError(StatusCode.TargetExist, "user not exist");

    // 2. 校验密码
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid)
      throw new LoginError(StatusCode.PasswordFailed, "password failed");

    // 3. 返回token
    const token = jwt.sign({ id: user._id }, req.app.get("secret"));
    return res.send({
      token,
      data: {
        StatusCode: StatusCode.Success,
        StatusMessage: "sign up success",
      },
    });
  } catch (e) {
    console.log(e);
    if (isLoginError(e))
      return res.send({
        data: {
          StatusMessage: e.message,
          StatusCode: e.code,
        },
      });

    return res.send({
      data: {
        StatusCode: StatusCode.ServiceError,
        StatusMessage: "service error",
      },
    });
  }
});

loginRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username)
      throw new LoginError(StatusCode.TargetNotExist, "username is not exist");
    if (!password)
      throw new LoginError(StatusCode.TargetNotExist, "password is not exist");
    const user = await findUserByName(username);

    // 验证账号是否存在
    if (user)
      throw new LoginError(StatusCode.TargetExist, "username is target");

    const newUser = await createUser(username, bcrypt.hashSync(password, 10));

    if (!newUser)
      throw new LoginError(StatusCode.CreateFailed, "create user failed");

    // 3. 返回token
    const token = jwt.sign({ id: newUser._id }, req.app.get("secret"));
    return res.send({
      token,
      data: {
        StatusCode: StatusCode.Success,
        StatusMessage: "sign in success",
      },
    });
  } catch (e) {
    console.log(e);
    if (isLoginError(e))
      return res.send({
        data: {
          StatusMessage: e.message,
          StatusCode: e.code,
        },
      });

    return res.send({
      data: {
        StatusCode: StatusCode.ServiceError,
        StatusMessage: "service error",
      },
    });
  }
});

export default loginRouter;
