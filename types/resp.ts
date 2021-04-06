export enum StatusCode {
  Success = 0,
  NotAllowed = 1,
  TargetNotExist = 2,
  TargetExist = 3,
  CreateFailed = 4,
  UpdateFailed = 5,
  DeleteFailed = 6,
  ServiceError = 7,
  NotLogin = 8,
  PasswordFailed = 9,
}

export type RespType = {
  StatusCode: StatusCode;
  StatusMessage: string;
  data?: any;
};
