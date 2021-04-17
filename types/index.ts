import {
  Request as _Request,
  Response as _Response,
  NextFunction,
} from "express";
import { DocumentType } from "@typegoose/typegoose";

import { User } from "../dao/users";
import { RespType } from "./resp";

export * from "./resp";
export * from "./error";
export * from "./task";
export * from "./compiler";

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

export enum AccessType {
  Application = 1,
  Service = 2,
}

export interface RecentlyAccess {
  Type: AccessType;
  Id: string;
  Name: string;
}

export interface MethodInfo {
  method: string;
  doc: string;
}

export interface ReturnParam {
  name: string;
  children?: ReturnParam[];
}
