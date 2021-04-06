import { Router } from "express";

import { Request, Response, StatusCode } from "../types";

const idlRouter = Router();

idlRouter.get("/", async (req: Request, res: Response) => {
  return res.send({
    data: {
      StatusCode: StatusCode.Success,
      StatusMessage: "success",
    },
  });
});

export default idlRouter;
