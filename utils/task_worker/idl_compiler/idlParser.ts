import {
  parse,
  StructDefinition,
  ThriftDocument,
  SyntaxType,
} from "@creditkarma/thrift-parser";

import {
  readdirSync,
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
} from "fs";

import { resolve, extname, basename, dirname } from "path";

interface ASTInfo {
  file: string;
  ast: ThriftDocument;
}

export class IdlParser {
  private path: string;
  private asts: ASTInfo[] = [];

  constructor(path) {
    this.path = path;
    this.asts = [];
    this.parse();
  }

  private parse() {
    try {
      const files = this.getFiles(this.path);

      if (Array.isArray(files) && files.length > 0) {
        this.asts = files
          .map((file) => {
            const fileContent = readFileSync(file, { encoding: "utf-8" });
            const ast = parse(fileContent);

            if (ast.type !== SyntaxType.ThriftDocument) return null;

            return { file, ast };
          })
          .filter((item) => !!item);
      }
    } catch (e) {
      console.log(e);
    }
  }

  private getFiles(path: string) {
    const ret: string[] = [];

    if (!existsSync(path)) return ret;

    const stat = statSync(path);

    if (!stat.isDirectory()) {
      if (extname(path) === ".thrift" && !basename(path).startsWith(".")) {
        return [path];
      } else {
        return [];
      }
    }

    const files = readdirSync(path);

    if (Array.isArray(files) && files.length > 0) {
      files.forEach((item) => {
        const innerRet = this.getFiles(resolve(path, item));
        ret.push(...innerRet);
      });
    }

    return ret;
  }

  public getRoot() {
    const indexThrift = this.asts.find(
      (item) => basename(item.file) === "index.thrift"
    );

    if (indexThrift) {
      return dirname(indexThrift.file);
    }

    const serviceFiles = this.asts.filter(
      (item) => this.serviceCount(item) > 0
    );

    if (Array.isArray(serviceFiles) && serviceFiles.length === 1) {
      const serviceFile = serviceFiles[0];

      const services = serviceFile.ast.body.filter(
        (item) => item.type === SyntaxType.ServiceDefinition
      );

      if (services.length === 1) {
        const path = dirname(serviceFile.file);
        const serviceName = basename(serviceFile.file);

        writeFileSync(
          resolve(path, "index.thrift"),
          `include "${serviceName}"`
        );

        return path;
      }
    }

    return "";
  }

  private serviceCount(astInfo: ASTInfo) {
    const ast = astInfo.ast;

    const services = ast.body.filter(
      (item) => item.type === SyntaxType.ServiceDefinition
    );

    return services.length;
  }

  public structs() {
    const ret: StructDefinition[] = [];

    this.asts.forEach((item) => {
      const ast = item.ast;

      if (Array.isArray(ast.body) && ast.body.length > 0) {
        const structs = ast.body.filter(
          (item) => item.type === SyntaxType.StructDefinition
        ) as StructDefinition[];

        ret.push(...structs);
      }
    });

    return ret;
  }
}
