import {
  ModuleType,
  ServiceMethodNode,
  SourceFile,
  StructNode,
  SyntaxKind,
  TypeNode,
  TypeReferenceNode,
  ReturnParam,
} from "../../../types";

export class Checker {
  private sourceFiles: SourceFile[];
  private checked: string[];

  constructor(sourceFiles: SourceFile[]) {
    this.sourceFiles = sourceFiles;
  }

  private getSourceFileByName(name: string): SourceFile {
    return this.sourceFiles.find((item) => item.name === name);
  }

  private getTypesByStruct(node: StructNode): TypeReferenceNode[] {
    return node.properties
      .filter((item) => item.type.__kind === SyntaxKind.TypeReference)
      .map((item) => item.type as TypeReferenceNode);
  }

  private displayTypeNode(typeNode: TypeNode): string {
    let args = "";
    if (
      typeNode.__kind === SyntaxKind.TypeReference &&
      Array.isArray((typeNode as TypeReferenceNode).typeArguments) &&
      (typeNode as TypeReferenceNode).typeArguments.length > 0
    ) {
      args = (typeNode as TypeReferenceNode).typeArguments
        .map((item) => this.displayTypeNode(item))
        .join(", ");
    }

    let ret = "";

    switch (typeNode.__kind) {
      case SyntaxKind.BooleanKeyword:
        ret = "boolean";
        break;
      case SyntaxKind.FloatKeyword:
        ret = "float";
        break;
      case SyntaxKind.IntKeyword:
        ret = "int";
        break;
      case SyntaxKind.StringKeyword:
        ret = "string";
        break;
      default:
        ret = (typeNode as TypeReferenceNode).typeName;
        break;
    }

    if (args.length > 0) {
      ret = `${ret}<${args}>`;
    }

    return ret;
  }

  private getTypes(typeNode: TypeReferenceNode): SourceFile[] {
    const typeName = this.displayTypeNode(typeNode);

    if (this.checked.includes(typeName)) return [];

    this.checked.push(typeName);

    const ret: SourceFile[] = [];

    if (
      Array.isArray(typeNode.typeArguments) &&
      typeNode.typeArguments.length > 0
    ) {
      typeNode.typeArguments.forEach((item) => {
        if (item.__kind === SyntaxKind.TypeReference) {
          const innerNodes = this.getTypes(item as TypeReferenceNode);
          ret.push(...innerNodes);
        }
      });
    }

    if (typeNode.typeName !== "Array") {
      const node = this.getSourceFileByName(typeNode.typeName);
      if (node) {
        ret.push(node);
        if (node.type === ModuleType.Struct) {
          const innerTypes = this.getTypesByStruct(node as StructNode);
          if (Array.isArray(innerTypes) && innerTypes.length > 0) {
            innerTypes.forEach((innerType) => {
              const innerNodes = this.getTypes(innerType);
              ret.push(...innerNodes);
            });
          }
        }
      }
    }

    return Array.from(new Set(ret));
  }

  getTypesByMethod(method: ServiceMethodNode): SourceFile[] {
    this.checked = [];
    const types: SourceFile[] = [];

    method.params.forEach((param) => {
      if (param.type.__kind === SyntaxKind.TypeReference) {
        const nodes = this.getTypes(param.type as TypeReferenceNode);
        types.push(...nodes);
      }
    });

    if (
      method.returnType &&
      method.returnType.__kind === SyntaxKind.TypeReference
    ) {
      const retNodes = this.getTypes(method.returnType as TypeReferenceNode);
      types.push(...retNodes);
    }

    return types;
  }

  private getParams(node: StructNode): ReturnParam[] {
    if (this.checked.includes(node.name)) return;
    this.checked.push(node.name);

    if (Array.isArray(node.properties) && node.properties.length > 0) {
      return node.properties.map((item) => {
        if (item.type.__kind === SyntaxKind.TypeReference) {
          const innerType = item.type as TypeReferenceNode;
          let typeName = innerType.typeName;

          if (
            typeName === "Array" &&
            Array.isArray(innerType.typeArguments) &&
            innerType.typeArguments.length > 0 &&
            innerType.typeArguments[0].__kind === SyntaxKind.TypeReference
          ) {
            typeName = (innerType.typeArguments[0] as TypeReferenceNode)
              .typeName;
          }

          const sourceFile = this.sourceFiles.find(
            (item) => item.name === typeName
          );

          if (sourceFile && sourceFile.type === ModuleType.Struct) {
            const children = this.getParams(sourceFile as StructNode);
            if (Array.isArray(children) && children.length > 0) {
              return { name: item.name, children };
            }
          }
        }

        return { name: item.name };
      });
    }

    return [];
  }

  getReturnsByMethod(method: ServiceMethodNode): ReturnParam[] {
    this.checked = [];

    if (
      method.returnType &&
      method.returnType.__kind === SyntaxKind.TypeReference
    ) {
      const returnType = method.returnType as TypeReferenceNode;
      let typeName = returnType.typeName;

      if (
        typeName === "Array" &&
        Array.isArray(returnType.typeArguments) &&
        returnType.typeArguments.length > 0 &&
        returnType.typeArguments[0].__kind === SyntaxKind.TypeReference
      ) {
        typeName = (returnType.typeArguments[0] as TypeReferenceNode).typeName;
      }

      const sourceFile = this.sourceFiles.find(
        (item) => item.name === typeName
      );
      if (sourceFile && sourceFile.type === ModuleType.Struct) {
        return this.getParams(sourceFile as StructNode);
      }
    }

    return [];
  }
}
