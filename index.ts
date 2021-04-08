import express from "express";
import cors from "cors";
import expressWs from "express-ws";

import { idlRouter, loginRouter, taskRouter } from "./router";
import { authMiddleware } from "./middleware";
import "./db/mongo";
import "./db/redis";

const appBase = express();

// 添加ws
const { app } = expressWs(appBase);

// 设置变量
app.set("secret", "moke_platform");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// 登录
app.use("/api/login", loginRouter);

// 上传idl
app.use("/api/idl", authMiddleware, idlRouter);

// task ws
app.use("/task", taskRouter);

// 静态下载地址
app.use("/public", authMiddleware, express.static(__dirname + "/public"));

app.listen(4000, () => {
  console.log("App listening on port 4000!");
});
