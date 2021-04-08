import { Router } from "express";
import { resolve } from "path";
import cluster from "cluster";
import expressWs, { Application } from "express-ws";

import { getTaskInfo } from "../dao/tasks";

cluster.setupMaster({
  exec: resolve(__dirname, "../utils/task_worker/index.js"),
});

const taskRouter = Router();

expressWs(taskRouter as Application);

taskRouter.ws("/:id", async (ws, req) => {
  const { params } = req;
  const { id } = params;
  console.log("taskRouter", id);

  const taskInfo = await getTaskInfo(id);

  if (!taskInfo) {
    ws.send(`ERROR: this task is not exist!`);
    ws.close();
    return;
  }

  const worker = cluster.fork({
    id,
    taskInfo: JSON.stringify(taskInfo),
  });

  worker.on("message", (msg) => {
    console.log(ws.readyState);
    ws.readyState === 1 && ws.send(msg);
    ws.readyState === 3 && worker.kill();
  });

  ws.on("close", () => {
    ws.close();
  });
});

export default taskRouter;
