import jwt from "jsonwebtoken";
import { findUserById } from "../dao/users";
import { StatusCode, MiddleFunction } from "../types";

const authMiddleware: MiddleFunction = async (request, response, next) => {
  try {
    // 验证登录
    const token = (String(request.headers.authorization) || "")
      .split(" ")
      .pop();
    if (!token) throw Error("not login");

    // 获取秘钥解析token
    const result = jwt.verify(token, request.app.get("secret"));
    const id = typeof result === "string" ? "" : (result as any).id;
    if (!id) throw Error("not login");

    // 数据库中读取用户
    request.user = await findUserById(id);
    if (!request.user) throw Error("not login");
    next();
  } catch (e) {
    console.log(e);
    return response.status(401).send({
      data: {
        StatusCode: StatusCode.NotLogin,
        StatusMessage: "not login",
      },
    });
  }
};

export default authMiddleware;
