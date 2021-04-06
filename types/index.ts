import {
  Request as _Request,
  Response as _Response,
  NextFunction,
} from "express";
import { DocumentType } from "@typegoose/typegoose";

import { User } from "../dao/users";
import { RespType } from "./resp";

export * from "./resp";

export interface Request extends _Request {
  user: DocumentType<User>;
}

export interface Response
  extends _Response<{
    data: RespType;
    token?: string;
  }> {}

export type MiddleFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => any;
