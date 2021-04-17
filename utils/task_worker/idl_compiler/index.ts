import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

import {
  ModuleType,
  ServiceMethodNode,
  ServiceNode,
  SourceFile,
} from "../../../types";
import { Emitter } from "./emitter";
import { Checker } from "./checker";
import { Parser } from "./parser";
import { queryIndex } from "./scaffold";

export * from "./idlParser";

export class Compiler {
  private sourceFiles: SourceFile[] = [];
  private services: ServiceNode[] = [];

  constructor(gqlPath: string, jsonPath: string, idlPath: string) {
    const parser = new Parser(gqlPath, jsonPath, idlPath);
    this.sourceFiles = parser.parse();
    this.services = this.sourceFiles.filter(
      (item) => item.type === ModuleType.Service
    ) as ServiceNode[];
  }

  getMethods(): ServiceMethodNode[] {
    const methods: ServiceMethodNode[] = [];

    this.services.forEach((item) => {
      if (Array.isArray(item.methods)) {
        methods.push(...item.methods);
      }
    });

    return methods;
  }

  private getMethodDoc(method: ServiceMethodNode) {
    const emitter = new Emitter();
    const signature = emitter.getSignature(method);
    const checker = new Checker(this.sourceFiles);
    const nodes = checker.getTypesByMethod(method);
    const typeCode = emitter.getCode(nodes, false, `function ${signature};`);

    return typeCode;
  }

  getMethodDocByName(method: string) {
    const methodInfo = this.getMethods().find((item) => item.name === method);
    if (!methodInfo) return "";

    return this.getMethodDoc(methodInfo);
  }

  getAllMethodDetails(): { method: string; doc: string }[] {
    const methods = this.getMethods();
    if (Array.isArray(methods) && methods.length > 0) {
      return methods.map((item) => {
        const method = item.name;
        const doc = this.getMethodDoc(item);

        return { method, doc };
      });
    }

    return [];
  }

  getTsFileContent(destPath: string): string {
    mkdirSync(destPath, { recursive: true });

    const emitter = new Emitter();

    const queryPath = resolve(destPath, "query");

    mkdirSync(queryPath, { recursive: true });
    writeFileSync(resolve(queryPath, "index.ts"), emitter.format(queryIndex));

    const { queries, apiInterface } = emitter.getQueriesAndMergedInterface(
      this.sourceFiles
    );

    writeFileSync(resolve(queryPath, "query.ts"), queries);

    const typesPath = resolve(destPath, "types");
    mkdirSync(typesPath, { recursive: true });

    writeFileSync(resolve(typesPath, "index.ts"), apiInterface);

    const types = this.sourceFiles.filter(
      (item) => item.type !== ModuleType.Service
    );
    const typesCode = emitter.getCode(types, true);
    writeFileSync(resolve(typesPath, "api.ts"), typesCode);

    const services = this.sourceFiles.filter(
      (item) => item.type === ModuleType.Service
    ) as ServiceNode[];

    const fetchCode = emitter.getFetchCodes(services);
    writeFileSync(resolve(destPath, "index.ts"), fetchCode);

    return destPath;
  }

  files() {
    return this.sourceFiles;
  }

  getReturnParams(methodName: string) {
    const methods = this.getMethods();
    if (Array.isArray(methods) && methods.length > 0) {
      const method = methods.find((item) => item.name === methodName);

      if (method) {
        const checker = new Checker(this.sourceFiles);
        return checker.getReturnsByMethod(method);
      }
    }
  }
}
