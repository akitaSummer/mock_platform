import {
  ModuleType,
  ServiceMethodNode,
  ServiceNode,
  SourceFile,
} from "../../../types";
import { Parser } from "./parser";

export * from "./idlParser";

export class Compiler {
  private sourceFiles: SourceFile[] = [];
  private services: ServiceNode[] = [];

  constructor(gqlPath: string, jsonPath: string, idlPath: string) {
    const parser = new Parser(gqlPath, jsonPath, idlPath);
  }
}
