import type { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

export type AnyOpenAPIDocument = OpenAPI.Document;

export type NormalizedHttpMethod =
  | "GET"
  | "PUT"
  | "POST"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "PATCH"
  | "TRACE";

export interface NormalizedOpenAPITag {
  name: string;
  description?: string;
  externalDocs?: {
    url: string;
    description?: string;
  };
}

export type SchemaLike =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3.SchemaObject
  | OpenAPIV2.ReferenceObject
  | OpenAPIV2.SchemaObject;

export interface NormalizedOpenAPIParameter {
  name?: string;
  in?: string;
  required: boolean;
  description?: string;
  schema?: SchemaLike;
  type?: string;
  deprecated?: boolean;
  example?: unknown;
  examples?: Record<string, unknown>;
  allowEmptyValue?: boolean;
  ref?: string;
}

export interface NormalizedOpenAPIResponse {
  statusCode: string;
  description?: string;
  ref?: string;
  content?: Record<string, OpenAPIV3.MediaTypeObject>;
  schema?: SchemaLike;
  headers?: Record<string, OpenAPIV2.HeaderObject | OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>;
}

export interface NormalizedOpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, OpenAPIV3.MediaTypeObject>;
  schema?: SchemaLike;
  ref?: string;
}

export interface NormalizedOpenAPIOperation {
  id?: string;
  method: NormalizedHttpMethod;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags: string[];
  parameters: NormalizedOpenAPIParameter[];
  requestBody?: NormalizedOpenAPIRequestBody;
  responses: NormalizedOpenAPIResponse[];
  security?: (OpenAPIV2.SecurityRequirementObject | OpenAPIV3.SecurityRequirementObject)[];
}

export interface NormalizedOpenAPIPath {
  path: string;
  summary?: string;
  description?: string;
  operations: NormalizedOpenAPIOperation[];
}

export type NormalizedSchemaMap = Record<string, SchemaLike>;

export interface NormalizedOpenAPISpec {
  info: {
    title: string;
    version?: string;
    description?: string;
  };
  tags: NormalizedOpenAPITag[];
  paths: NormalizedOpenAPIPath[];
  schemas: NormalizedSchemaMap;
  raw: AnyOpenAPIDocument;
}
