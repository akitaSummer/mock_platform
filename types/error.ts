import { Response, IdlUploadTaskStatusCode, StatusCode } from "./";

export class RespError extends Error {
  public code: StatusCode;
  public message: string;

  constructor(code: StatusCode, message: string) {
    super();
    this.code = code;
    this.message = message;
  }
}

export const isRespError = (e: any): e is RespError => {
  return e && e.code;
};

export const handleError = (e: Error, res: Response) => {
  console.log(e);
  if (isRespError(e))
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
};

export class HError extends Error {
  public code: IdlUploadTaskStatusCode;

  constructor(message: string, code: IdlUploadTaskStatusCode) {
    super(message);
    this.code = code;
  }
}

export const isHError = (e: any) => {
  return e && e.code;
};
