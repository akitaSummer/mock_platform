import {
  EnumNode,
  EnumPropertyNode,
  ModuleType,
  ServiceMethodNode,
  ServiceNode,
  SourceFile,
  StructNode,
  StructPropertyNode,
  SyntaxKind,
  TypeNode,
  TypeReferenceNode,
  ReturnParam,
} from "../../../types";
import * as prettier from "prettier";
import { Checker } from "./checker";

export class Emitter {
  private needExport = false;

  format(code: string) {
    return prettier.format(code, {
      useTabs: false,
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: "all",
      bracketSpacing: true,
      jsxBracketSameLine: false,
      parser: "typescript",
    });
  }

  getCode(
    sourceFiles: SourceFile[],
    needExport = false,
    preCode = "",
    preType = ""
  ) {
    this.needExport = needExport;
    const code = sourceFiles
      .map((node) => this.visitSourceFile(node, preType))
      .join("\n\n");

    return this.format(preCode + "\n\n" + code);
  }

  public getSignature(method: ServiceMethodNode, preType = ""): string {
    const name = method.name;
    let params = "";

    if (Array.isArray(method.params) && method.params.length > 0) {
      params = method.params
        .map((item) => {
          const type = this.visitTypeNode(item.type, preType);
          if (type && type.length > 0) {
            return `${item.name}: ${type}`;
          }
          return `${item.name}`;
        })
        .join(", ");
    }

    const returnType = this.visitTypeNode(method.returnType, preType);

    let code = `${name}(${params})`;
    if (returnType && returnType.length > 0) {
      code = `${code}: ${returnType}`;
    }

    return code;
  }

  private visitSourceFile(node: SourceFile, preType = ""): string {
    switch (node.type) {
      case ModuleType.Enum: {
        return this.visitEnumNode(node as EnumNode);
      }
      case ModuleType.Struct: {
        return this.visitStructNode(node as StructNode);
      }
      case ModuleType.Service: {
        return this.visitServiceNode(node as ServiceNode, preType);
      }
      default:
        return "";
    }
  }

  private visitTypeNode(node: TypeNode, preType = ""): NonNullable<string> {
    switch (node.__kind) {
      case SyntaxKind.StringKeyword: {
        return "string";
      }
      case SyntaxKind.IntKeyword:
      case SyntaxKind.FloatKeyword: {
        return "number";
      }
      case SyntaxKind.BooleanKeyword: {
        return "boolean";
      }
      case SyntaxKind.TypeReference: {
        return this.visitTypeReference(node as TypeReferenceNode, preType);
      }
      default: {
        return "any";
      }
    }
  }

  private visitTypeReference(node: TypeReferenceNode, preType = ""): string {
    let typeName = node.typeName;
    if (preType && preType.length > 0) {
      typeName = `${preType}.${typeName}`;
    }

    if (Array.isArray(node.typeArguments) && node.typeArguments.length > 0) {
      const args = node.typeArguments
        .map((item) => this.visitTypeNode(item))
        .join(", ");

      return typeName + "<" + args + ">";
    }

    return typeName;
  }

  private visitEnumProperty(node: EnumPropertyNode): string {
    let name = node.name;

    let value = node.value.raw;
    if (value && value.length > 0) {
      return `${name} = ${value},`;
    } else {
      return `${name},`;
    }
  }

  private visitEnumNode(node: EnumNode): string {
    const name = node.name;
    const properties = node.properties
      .map((item) => this.visitEnumProperty(item))
      .join("\n");

    const code = `enum ${name} {
      ${properties}
    }`;

    if (this.needExport) {
      return `export ${code}`;
    }
    return code;
  }

  private visitStructProperty(node: StructPropertyNode): string {
    let name = node.name;
    if (!node.required) {
      name = `${name}?`;
    }

    let type = this.visitTypeNode(node.type);
    if (type && type.length > 0) {
      return `${name}: ${type};`;
    }

    return `${name};`;
  }

  private visitStructNode(node: StructNode): string {
    const name = node.name;
    let properties = "";
    if (Array.isArray(node.properties) && node.properties.length > 0) {
      properties = node.properties
        .map((item) => this.visitStructProperty(item))
        .join("\n");
    }

    const code = `interface ${name} {
        ${properties}
      }`;

    if (this.needExport) {
      return `export ${code}`;
    }
    return code;
  }

  private visitServiceNode(node: ServiceNode, preType = ""): string {
    return "";
  }

  private getMethods(services: Array<ServiceNode>): Array<ServiceMethodNode> {
    const ret: Array<ServiceMethodNode> = [];
    services.forEach((service) => {
      if (Array.isArray(service.methods) && service.methods.length > 0) {
        ret.push(...service.methods);
      }
    });

    return ret;
  }

  private whiteSpace(length: number) {
    return new Array(length).fill(" ").join("");
  }

  private getResQueryStr(params: Array<ReturnParam>, whitespace = 4): string {
    if (!Array.isArray(params) || params.length === 0) return "";

    const str: Array<string> = [];
    params.forEach((param) => {
      if (Array.isArray(param.children) && param.children.length > 0) {
        const innerStr = this.getResQueryStr(param.children, whitespace + 2);
        str.push(`${this.whiteSpace(whitespace)}${param.name} {`);
        str.push(innerStr);
        str.push(`${this.whiteSpace(whitespace)}}`);
      } else {
        str.push(`${this.whiteSpace(whitespace)}${param.name}`);
      }
    });

    return str.join("\n");
  }

  public getQueriesAndMergedInterface(
    nodes: Array<SourceFile>
  ): { queries: string; apiInterface: string } {
    const services = nodes.filter(
      (item) => item.type === ModuleType.Service
    ) as Array<ServiceNode>;

    const methods = this.getMethods(services);
    const checker = new Checker(nodes);

    const queriesCode = methods
      .map((item) => {
        let paramTypeStr = "";
        let paramNameStr = "";

        if (Array.isArray(item.params) && item.params.length > 0) {
          const param = item.params[0];
          paramTypeStr = ": " + this.visitTypeNode(param.type);
          paramNameStr = param.name;
        }

        const params = checker.getReturnsByMethod(item);
        let resStr = this.getResQueryStr(params);
        if (resStr && resStr.length > 0) {
          resStr = `\n${resStr}`;
        }

        return `export const ${item.name} = () => \`
query ${item.name}($data${paramTypeStr}!) {
  ${item.name}(${paramNameStr}: $data) {${resStr}
  }
}
\``;
      })
      .join("\n\n");

    const interfacePropsCode = methods
      .map((item) => {
        let reqStr = "";
        if (Array.isArray(item.params) && item.params.length > 0) {
          const param = item.params[0];
          reqStr = this.visitTypeNode(param.type, "APITypes");
        } else {
          reqStr = "any";
        }

        const respStr = this.visitTypeNode(item.returnType, "APITypes");
        return `${item.name}: {req: ${reqStr}, resp: ${respStr}}`;
      })
      .join("\n");

    const interfaceCode = `import * as APITypes from './api';
    export * as APITypes from './api';

    export interface APIs {
      ${interfacePropsCode}
    }
    `;

    const queries = this.format(queriesCode);
    const apiInterface = this.format(interfaceCode);
    return { queries, apiInterface };
  }

  public getFetchCodes(nodes: Array<ServiceNode>): string {
    const methods = this.getMethods(nodes);
    const code = methods
      .map((method) => {
        const name = method.name;
        let params = "";
        const params2: Array<string> = [];
        if (Array.isArray(method.params) && method.params.length > 0) {
          params = method.params
            .map((param) => {
              const type = this.visitTypeNode(param.type, "APITypes");
              params2.push(`...${param.name}`);
              return `${param.name}: ${type}`;
            })
            .join(", ");
        }
        return `export const ${name} = async (${params}) => {
              return await gql('${name}', {
                ${params2.join(", ")}
              })
            }`;
      })
      .join("\n\n");

    const retCode = `import { gql } from './query';
    export { gql } from './query';
    import { APITypes } from './types';
    export { APITypes } from './types';
    
    ${code}`;

    return this.format(retCode);
  }
}
