export interface ICompilerHost {
    root: string
    getSourceFiles(): SourceFile[]
  }
  
  export enum SyntaxKind {
    SourceFile,
    Identifier,
    IntKeyword,
    StringKeyword,
    BooleanKeyword,
    TypeReference,
    ServiceMethod,
    Parameter,
    StructProperty,
    EnumProperty,
    FloatKeyword
  }
  
  export enum ModuleType {
    Service,
    Struct,
    Enum
  }
  
  export class ASTNode {
    __id: string
    __kind: SyntaxKind
  }
  
  export class TypeNode extends ASTNode {}
  
  export class KeywordTypeNode extends TypeNode {
    __kind:
      | SyntaxKind.IntKeyword
      | SyntaxKind.StringKeyword
      | SyntaxKind.BooleanKeyword
      | SyntaxKind.FloatKeyword
  }
  
  export class TypeReferenceNode extends TypeNode {
    __kind: SyntaxKind.TypeReference
    typeName: string
    typeArguments?: TypeNode[]
  }
  
  export class IdentifierNode extends ASTNode {
    __kind: SyntaxKind.Identifier
    value: string | number
    raw: string
  }
  
  export class SourceFile extends ASTNode {
    __kind: SyntaxKind.SourceFile
    type: ModuleType
    name: string
  }
  
  export class ParameterNode extends ASTNode {
    __kind: SyntaxKind.Parameter
    name: string
    type: TypeNode
  }
  
  export class ServiceMethodNode extends ASTNode {
    __kind: SyntaxKind.ServiceMethod
    name: string
    params: ParameterNode[]
    returnType: TypeNode
  }
  
  export class ServiceNode extends SourceFile {
    type: ModuleType.Service
    methods: ServiceMethodNode[]
  }
  
  export class StructPropertyNode extends ASTNode {
    __kind: SyntaxKind.StructProperty
    name: string
    type: TypeNode
    required: boolean
  }
  
  export class StructNode extends SourceFile {
    type: ModuleType.Struct
    properties: StructPropertyNode[]
  }
  
  export class EnumPropertyNode extends ASTNode {
    __kind: SyntaxKind.EnumProperty
    name: string
    value: IdentifierNode
  }
  
  export class EnumNode extends SourceFile {
    type: ModuleType.Enum
    properties: EnumPropertyNode[]
  }
  