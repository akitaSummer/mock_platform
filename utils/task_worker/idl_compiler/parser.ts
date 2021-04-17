import { resolve } from "path";
import * as gql from "graphql";
import { existsSync, statSync } from "fs";
import {
  SourceFile,
  EnumNode,
  EnumPropertyNode,
  StructNode,
  ServiceNode,
  StructPropertyNode,
  TypeNode,
  ServiceMethodNode,
  ParameterNode,
} from "../../../types";
import {
  createEnumNode,
  createEnumProperty,
  createIdentifier,
  createStructNode,
  createStructProperty,
  createTypeNode,
  createServiceNode,
  createServiceMethodNode,
  createParameterNode,
} from "./node";
import { IdlParser } from "./idlParser";
import {
  StructDefinition,
  SyntaxType,
  Identifier,
} from "@creditkarma/thrift-parser";

interface JsonEnum {
  name: string;
  members: { name: string; value: number }[];
}

export class Parser {
  private gqlPath: string;
  private jsonPath: string;
  private idlParser: IdlParser;

  constructor(gqlPath: string, jsonPath: string, idlPath: string) {
    this.gqlPath = gqlPath;
    this.jsonPath = jsonPath;
    this.idlParser = new IdlParser(idlPath);
  }

  public parse(): Array<SourceFile> {
    const enums = this.getEnums();
    const { structs, services } = this.getStructsAndServices();
    return [...enums, ...structs, ...services];
  }

  private getEnums(): Array<EnumNode> {
    try {
      const jsonPath = resolve(this.jsonPath, "index.json");
      if (!existsSync(jsonPath)) return [];
      const stat = statSync(jsonPath);
      if (!stat.isFile()) return [];

      const types = require(jsonPath);

      if (!types) return [];
      const enums: Array<JsonEnum> = types.enums;
      if (!enums) return [];

      if (!Array.isArray(enums) || enums.length === 0) return [];

      const ret: Array<EnumNode> = [];
      enums.forEach((item) => {
        const found = ret.find((node) => node.name === item.name);
        if (found) return;

        let newNode: EnumNode = null;
        if (!Array.isArray(item.members) || item.members.length === 0) {
          newNode = createEnumNode(item.name, []);
        } else {
          const properties: Array<EnumPropertyNode> = item.members.map(
            (prop) => {
              const value = createIdentifier(prop.value);
              return createEnumProperty(prop.name, value);
            }
          );

          newNode = createEnumNode(item.name, properties);
        }

        if (newNode) {
          ret.push(newNode);
        }
      });

      return ret;
    } catch (err) {
      return [];
    }
  }

  private getTypeNode(type: gql.TypeNode): TypeNode {
    if (type.kind === "NonNullType") {
      return this.getTypeNode(type.type);
    } else if (type.kind === "NamedType") {
      return createTypeNode(type.name.value);
    } else if (type.kind === "ListType") {
      const args = this.getTypeNode(type.type);
      return createTypeNode("Array", [args]);
    }

    return null;
  }

  private getEnumType(name: string, idlStruct: StructDefinition) {
    const foundField = idlStruct.fields.find(
      (item) =>
        item.name.value === name &&
        item.fieldType.type === SyntaxType.Identifier
    );

    if (foundField) {
      const typeName = (foundField.fieldType as Identifier).value
        .split(".")
        .pop();
      return this.getTypeNode({
        kind: "NamedType",
        name: { kind: "Name", value: typeName },
      });
    }

    return null;
  }

  private getStructNames(): Array<string> {
    const jsonPath = resolve(this.jsonPath, "index.json");
    if (!existsSync(jsonPath)) return [];
    const stat = statSync(jsonPath);
    if (!stat.isFile()) return [];

    const types = require(jsonPath);

    if (!types) return [];
    const structs: Array<any> = types.structs;
    if (!structs) return [];

    return structs.map((item) => item.name);
  }

  private isService(
    node: gql.DefinitionNode,
    structNames: Array<string>
  ): boolean {
    if (node.kind !== "ObjectTypeDefinition") return false;
    if (structNames.includes(node.name.value)) return false;
    if (!Array.isArray(node.fields) || node.fields.length === 0) return false;

    const field = node.fields.filter((item) => {
      if (item.kind !== "FieldDefinition") return false;
      if (!Array.isArray(item.arguments) || item.arguments.length === 0)
        return false;
      return true;
    });

    return field.length > 0;
  }

  private getStructNode(
    node: gql.ObjectTypeDefinitionNode | gql.InputObjectTypeDefinitionNode,
    idlStructs: Array<StructDefinition>
  ): StructNode {
    let properties: Array<StructPropertyNode> = [];
    const structName = node.name.value;
    const idlStruct = idlStructs.find((item) => item.name.value === structName);

    if (Array.isArray(node.fields) && node.fields.length > 0) {
      properties = node.fields
      // @ts-ignore
        .map((field: gql.ASTNode) => {
          if (
            field.kind !== "InputValueDefinition" &&
            field.kind !== "FieldDefinition"
          )
            return null;

          const name = field.name.value;
          let required = false;
          if (field.type.kind === "NonNullType") {
            required = true;
          }

          let type: TypeNode = null;
          if (idlStruct) {
            let checkType: gql.TypeNode;
            if (field.type.kind === "NamedType") {
              checkType = field.type;
            } else if (field.type.kind === "NonNullType") {
              checkType = field.type.type;
            }

            if (
              checkType &&
              checkType.kind === "NamedType" &&
              checkType.name.value === "Int"
            ) {
              type = this.getEnumType(field.name.value, idlStruct);
            }
          }

          if (!type) {
            type = this.getTypeNode(field.type);
          }

          return createStructProperty(name, type, required);
        })
        .filter((item) => !!item);

      if (Array.isArray(properties) && properties.length > 0) {
        return createStructNode(structName, properties);
      } else {
        return null;
      }
    }
  }

  private getServiceNode(node: gql.ObjectTypeDefinitionNode): ServiceNode {
    let methods: Array<ServiceMethodNode> = [];

    if (Array.isArray(node.fields) && node.fields.length > 0) {
      methods = node.fields
        .map((field: gql.ASTNode) => {
          if (field.kind === "FieldDefinition") {
            const name = field.name.value;
            const returnType = this.getTypeNode(field.type);
            let params: Array<ParameterNode> = [];
            if (Array.isArray(field.arguments) && field.arguments.length > 0) {
              params = field.arguments.map((arg) => {
                return createParameterNode(
                  arg.name.value,
                  this.getTypeNode(arg.type)
                );
              });
            }
            return createServiceMethodNode(name, params, returnType);
          }

          return null;
        })
        .filter((method) => !!method);
    }

    if (Array.isArray(methods) && methods.length > 0) {
      return createServiceNode(node.name.value, methods);
    } else {
      return null;
    }
  }

  private getStructsAndServices(): {
    services: Array<ServiceNode>;
    structs: Array<StructNode>;
  } {
    try {
      const structPath = resolve(this.gqlPath, "typedefs");
      const content = require(structPath);

      if (!content || content.length === 0)
        return { services: [], structs: [] };

      const res = gql.parse(content);
      if (!Array.isArray(res.definitions) || res.definitions.length === 0)
        return { services: [], structs: [] };

      const definitions = res.definitions;
      const idlStructs = this.idlParser.structs();
      const structNames = this.getStructNames();

      const structs: Array<StructNode> = [];
      const services: Array<ServiceNode> = [];

      definitions.map((item) => {
        if (
          item.kind !== "InputObjectTypeDefinition" &&
          item.kind !== "ObjectTypeDefinition"
        ) {
          return;
        }

        if (this.isService(item, structNames)) {
          const service = this.getServiceNode(
            item as gql.ObjectTypeDefinitionNode
          );
          if (service && !services.find((node) => node.name === service.name)) {
            services.push(service);
          }
        } else {
          const struct = this.getStructNode(item, idlStructs);

          if (struct && !structs.find((node) => node.name === struct.name)) {
            structs.push(struct);
          }
        }
      });

      return { structs, services };
    } catch (err) {
      return { structs: [], services: [] };
    }
  }
}
