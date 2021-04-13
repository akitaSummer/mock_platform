import { createTasks } from "dao/tasks";
import {
  ASTNode,
  EnumNode,
  EnumPropertyNode,
  IdentifierNode,
  ModuleType,
  StructNode,
  StructPropertyNode,
  SyntaxKind,
  TypeNode,
  SourceFile,
  TypeReferenceNode,
  ServiceNode,
  ServiceMethodNode,
  ParameterNode,
} from "../../../types";
import { uuid } from "../../uuid";

const createNode = (kind: SyntaxKind): ASTNode => {
  return {
    __id: uuid(),
    __kind: kind,
  };
};

const createSourceFile = (name: string, type: ModuleType): SourceFile => {
  const node = createNode(SyntaxKind.SourceFile) as SourceFile;
  node.name = name;
  node.type = type;

  return node;
};

export const createEnumNode = (
  name: string,
  properties: EnumPropertyNode[]
): EnumNode => {
  const node = createSourceFile(name, ModuleType.Enum) as EnumNode;
  node.properties = properties;
  return node;
};

export const createIdentifier = (value: string | number): IdentifierNode => {
  const node = createNode(SyntaxKind.Identifier) as IdentifierNode;
  node.value = value;
  node.raw = value.toString();

  return node;
};

export const createEnumProperty = (
  name: string,
  value: IdentifierNode
): EnumPropertyNode => {
  const node = createNode(SyntaxKind.EnumProperty) as EnumPropertyNode;
  node.name = name;
  node.value = value;

  return node;
};

export const createStructProperty = (
  name: string,
  type: TypeNode,
  required: boolean
): StructPropertyNode => {
  const node = createNode(SyntaxKind.StructProperty) as StructPropertyNode;
  node.name = name;
  node.type = type;
  node.required = required;

  return node;
};

export const createStructNode = (
  name: string,
  properties: Array<StructPropertyNode>
): StructNode => {
  const node = createSourceFile(name, ModuleType.Struct) as StructNode;
  node.properties = properties;
  return node;
};

export const createTypeNode = (
  typeName: string,
  argNodes?: TypeNode[]
): TypeNode => {
  switch (typeName) {
    case "String": {
      return createNode(SyntaxKind.StringKeyword);
    }
    case "Int": {
      return createNode(SyntaxKind.IntKeyword);
    }
    case "Float": {
      return createNode(SyntaxKind.FloatKeyword);
    }
    case "Boolean": {
      return createNode(SyntaxKind.BooleanKeyword);
    }
    default: {
      return createTypeReferenceNode(typeName, argNodes);
    }
  }
};

export const createTypeReferenceNode = (
  typeName: string,
  argNodes?: TypeNode[]
): TypeReferenceNode => {
  const node = createNode(SyntaxKind.TypeReference) as TypeReferenceNode;

  node.typeName = typeName;
  if (Array.isArray(argNodes)) {
    node.typeArguments = argNodes;
  }

  return node;
};

export const createParameterNode = (
  name: string,
  type: TypeNode
): ParameterNode => {
  const node = createNode(SyntaxKind.Parameter) as ParameterNode;
  node.name = name;
  node.type = type;

  return node;
};

export const createServiceMethodNode = (
  name: string,
  params: Array<ParameterNode>,
  returnType: TypeNode
) => {
  const node = createNode(SyntaxKind.ServiceMethod) as ServiceMethodNode;
  node.name = name;
  node.params = params;
  node.returnType = returnType;

  return node;
};

export const createServiceNode = (
  name: string,
  methods: Array<ServiceMethodNode>
): ServiceNode => {
  const node = createSourceFile(name, ModuleType.Service) as ServiceNode;
  node.methods = methods;
  return node;
};
