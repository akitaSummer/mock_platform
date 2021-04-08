export type IdlUploadTaskType = {
  userName: string;
  userId: string;
  projectName: string;
  temp: string;
  filename: string;
  status: IdlUploadTaskStatus;
  step: IdlUploadTaskStep;
};

export enum IdlUploadTaskStatus {
  Pending = 0,
  Finished = 1,
  UnexpectedExit = 2,
}

export enum IdlUploadTaskStep {
  Waiting = 0,
  Uncompress = 1,
  Verify = 2,
  Compile = 3,
  Pack = 4,
  Distribute = 5,
  Finished = 6,
}

export enum IdlUploadTaskStatusCode {
  None = 0,
  InvalidVersion = 1,
  ServiceNotExist = 2,
  UncompressFailed = 3,
  VerifyFailed = 4,
  CompileFailed = 5,
  CompressFailed = 6,
  UploadFailed = 7,
  Unknown = 8,
  Timeout = 9,
  DistributeFailed = 10,
}
