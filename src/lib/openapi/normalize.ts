import type { OpenAPIV2, OpenAPIV3 } from "openapi-types";

import type {
  AnyOpenAPIDocument,
  NormalizedHttpMethod,
  NormalizedOpenAPIOperation,
  NormalizedOpenAPIParameter,
  NormalizedOpenAPIPath,
  NormalizedOpenAPIRequestBody,
  NormalizedOpenAPIResponse,
  NormalizedOpenAPISpec,
  NormalizedOpenAPITag,
  NormalizedSchemaMap,
  SchemaLike,
} from "./types";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;

type HttpMethodKey = (typeof HTTP_METHODS)[number];
type ParameterLike = OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject | OpenAPIV2.Parameter;
type ResponsesLike = OpenAPIV3.ResponsesObject | OpenAPIV2.ResponsesObject | undefined;

type OperationLike = OpenAPIV3.OperationObject | OpenAPIV2.OperationObject;

type PathItemLike = OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject;

type TagLike = OpenAPIV3.TagObject | OpenAPIV2.TagObject;

export function normalizeOpenApiDocument(document: AnyOpenAPIDocument): NormalizedOpenAPISpec {
  const isV3 = isOpenAPIV3Document(document);

  return {
    info: {
      title: document.info?.title ?? "Untitled API",
      version: document.info?.version,
      description: document.info?.description,
    },
    tags: normalizeTags(document.tags as TagLike[] | undefined),
    paths: normalizePaths(document.paths as OpenAPIV3.PathsObject | OpenAPIV2.PathsObject, { isV3 }),
    schemas: extractSchemas(document),
    raw: document,
  };
}

function normalizeTags(tags: TagLike[] | undefined): NormalizedOpenAPITag[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  return tags.map((tag) => ({
    name: tag.name,
    description: tag.description ?? undefined,
    externalDocs: tag.externalDocs
      ? {
          url: tag.externalDocs.url,
          description: tag.externalDocs.description ?? undefined,
        }
      : undefined,
  }));
}

function normalizePaths(
  paths: OpenAPIV3.PathsObject | OpenAPIV2.PathsObject | undefined,
  { isV3 }: { isV3: boolean },
): NormalizedOpenAPIPath[] {
  if (!paths) {
    return [];
  }

  const normalized: NormalizedOpenAPIPath[] = [];

  for (const [pathKey, pathValue] of Object.entries(paths)) {
    if (!pathValue || isReferenceObject(pathValue)) {
      continue;
    }

    const pathItem = pathValue as PathItemLike;
    const operations: NormalizedOpenAPIOperation[] = [];

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<HttpMethodKey, unknown>)[method] as OperationLike | undefined;

      if (!operation) {
        continue;
      }

      operations.push(
        normalizeOperation({
          method,
          pathItem,
          operation,
          isV3,
        }),
      );
    }

    if (operations.length === 0) {
      continue;
    }

    operations.sort((a, b) => a.method.localeCompare(b.method));

    const descriptivePathItem = pathItem as { summary?: string; description?: string };

    normalized.push({
      path: pathKey,
      summary: descriptivePathItem.summary,
      description: descriptivePathItem.description,
      operations,
    });
  }

  normalized.sort((a, b) => a.path.localeCompare(b.path));

  return normalized;
}

function normalizeOperation({
  method,
  pathItem,
  operation,
  isV3,
}: {
  method: HttpMethodKey;
  pathItem: PathItemLike;
  operation: OperationLike;
  isV3: boolean;
}): NormalizedOpenAPIOperation {
  const pathParameters = Array.isArray(pathItem.parameters) ? (pathItem.parameters as ParameterLike[]) : [];
  const operationParameters = Array.isArray(operation.parameters)
    ? (operation.parameters as ParameterLike[])
    : [];

  const requestBody = normalizeRequestBody({ isV3, operation, pathParameters, operationParameters });

  const parameters = normalizeParameters({
    isV3,
    pathParameters,
    operationParameters,
  });

  const responses = normalizeResponses(operation.responses as ResponsesLike, isV3);

  return {
    id: operation.operationId ?? undefined,
    method: method.toUpperCase() as NormalizedHttpMethod,
    summary: operation.summary ?? undefined,
    description: operation.description ?? undefined,
    deprecated: operation.deprecated ?? false,
    tags: operation.tags ?? [],
    parameters,
    requestBody,
    responses,
    security: operation.security ?? undefined,
  };
}

function normalizeParameters({
  isV3,
  pathParameters,
  operationParameters,
}: {
  isV3: boolean;
  pathParameters: ParameterLike[];
  operationParameters: ParameterLike[];
}): NormalizedOpenAPIParameter[] {
  const combined = [...pathParameters, ...operationParameters];
  const result: NormalizedOpenAPIParameter[] = [];
  const seenKeys = new Map<string, number>();

  combined.forEach((parameter) => {
    if (!parameter) {
      return;
    }

    const normalized = normalizeParameter(parameter, isV3);

    if (!normalized) {
      return;
    }

    const key = buildParameterKey(parameter);

    if (key && seenKeys.has(key)) {
      result[seenKeys.get(key)!] = normalized;
      return;
    }

    result.push(normalized);

    if (key) {
      seenKeys.set(key, result.length - 1);
    }
  });

  if (!isV3) {
    return result.filter((parameter) => !(parameter.in === "body" && !parameter.ref));
  }

  return result;
}

function normalizeParameter(parameter: ParameterLike, isV3: boolean): NormalizedOpenAPIParameter | null {
  if (isReferenceObject(parameter)) {
    return {
      ref: parameter.$ref,
      required: false,
    };
  }

  if (isV3) {
    const v3Parameter = parameter as OpenAPIV3.ParameterObject;

    return {
      name: v3Parameter.name,
      in: v3Parameter.in,
      required: Boolean(v3Parameter.required),
      description: v3Parameter.description ?? undefined,
      schema: (v3Parameter.schema ?? undefined) as SchemaLike | undefined,
      deprecated: v3Parameter.deprecated ?? false,
      example: v3Parameter.example,
      examples: v3Parameter.examples as Record<string, unknown> | undefined,
      allowEmptyValue: v3Parameter.allowEmptyValue ?? undefined,
    };
  }

  const v2Parameter = parameter as OpenAPIV2.Parameter;
  const general = v2Parameter as OpenAPIV2.GeneralParameterObject;

  const normalized: NormalizedOpenAPIParameter = {
    name: v2Parameter.name,
    in: (v2Parameter as { in?: string }).in,
    required: Boolean((v2Parameter as { required?: boolean }).required),
    description: (v2Parameter as { description?: string }).description ?? undefined,
    deprecated: (v2Parameter as { deprecated?: boolean }).deprecated ?? false,
    allowEmptyValue: (v2Parameter as { allowEmptyValue?: boolean }).allowEmptyValue ?? undefined,
  };

  if ("schema" in v2Parameter && v2Parameter.schema) {
    normalized.schema = v2Parameter.schema as SchemaLike;
  }

  if (general && "type" in general && general.type) {
    normalized.type = general.type;

    if (general.type === "array" && general.items) {
      normalized.schema = {
        type: "array",
        items: general.items,
      } as SchemaLike;
    }
  }

  return normalized;
}

function normalizeRequestBody({
  isV3,
  operation,
  pathParameters,
  operationParameters,
}: {
  isV3: boolean;
  operation: OperationLike;
  pathParameters: ParameterLike[];
  operationParameters: ParameterLike[];
}): NormalizedOpenAPIRequestBody | undefined {
  if (isV3) {
    const requestBody = (operation as OpenAPIV3.OperationObject).requestBody;

    if (!requestBody) {
      return undefined;
    }

    if (isReferenceObject(requestBody)) {
      return {
        ref: requestBody.$ref,
      };
    }

    return {
      description: requestBody.description ?? undefined,
      required: requestBody.required ?? undefined,
      content: requestBody.content ?? undefined,
    };
  }

  const combined = [...operationParameters, ...pathParameters];

  for (let index = combined.length - 1; index >= 0; index -= 1) {
    const parameter = combined[index];

    if (!parameter || isReferenceObject(parameter)) {
      continue;
    }

    const bodyParameter = parameter as OpenAPIV2.BodyParameter;

    if (bodyParameter.in === "body") {
      return {
        description: bodyParameter.description ?? undefined,
        required: bodyParameter.required ?? undefined,
        schema: bodyParameter.schema as SchemaLike,
      };
    }
  }

  return undefined;
}

function normalizeResponses(
  responses: ResponsesLike,
  isV3: boolean,
): NormalizedOpenAPIResponse[] {
  if (!responses) {
    return [];
  }

  const normalized: NormalizedOpenAPIResponse[] = [];

  for (const [statusCode, responseCandidate] of Object.entries(responses)) {
    if (!responseCandidate) {
      continue;
    }

    if (isReferenceObject(responseCandidate)) {
      normalized.push({
        statusCode,
        ref: responseCandidate.$ref,
      });
      continue;
    }

    if (isV3) {
      const response = responseCandidate as OpenAPIV3.ResponseObject;

      normalized.push({
        statusCode,
        description: response.description ?? undefined,
        content: response.content ?? undefined,
        headers: response.headers as Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject> | undefined,
      });
      continue;
    }

    const response = responseCandidate as OpenAPIV2.ResponseObject;

    normalized.push({
      statusCode,
      description: response.description ?? undefined,
      schema: response.schema as SchemaLike,
      headers: response.headers as Record<string, OpenAPIV2.HeaderObject> | undefined,
    });
  }

  normalized.sort(compareResponses);

  return normalized;
}

function compareResponses(a: NormalizedOpenAPIResponse, b: NormalizedOpenAPIResponse): number {
  if (a.statusCode === b.statusCode) {
    return 0;
  }

  if (a.statusCode === "default") {
    return 1;
  }

  if (b.statusCode === "default") {
    return -1;
  }

  const aNumber = Number.parseInt(a.statusCode, 10);
  const bNumber = Number.parseInt(b.statusCode, 10);

  if (Number.isNaN(aNumber) && Number.isNaN(bNumber)) {
    return a.statusCode.localeCompare(b.statusCode);
  }

  if (Number.isNaN(aNumber)) {
    return 1;
  }

  if (Number.isNaN(bNumber)) {
    return -1;
  }

  return aNumber - bNumber;
}

function extractSchemas(document: AnyOpenAPIDocument): NormalizedSchemaMap {
  if (isOpenAPIV3Document(document)) {
    const schemas = (document.components?.schemas ?? {}) as Record<string, SchemaLike>;
    return { ...schemas };
  }

  if (isOpenAPIV2Document(document)) {
    const schemas = (document.definitions ?? {}) as Record<string, SchemaLike>;
    return { ...schemas };
  }

  return {};
}

function isReferenceObject(value: unknown): value is OpenAPIV3.ReferenceObject | OpenAPIV2.ReferenceObject {
  return Boolean(value) && typeof value === "object" && "$ref" in (value as Record<string, unknown>);
}

function buildParameterKey(parameter: ParameterLike): string | null {
  if (isReferenceObject(parameter)) {
    return parameter.$ref ?? null;
  }

  if (!parameter.name) {
    return null;
  }

  const location = (parameter as { in?: string }).in ?? "";

  return `${parameter.name}|${location}`;
}

function isOpenAPIV3Document(document: AnyOpenAPIDocument): document is OpenAPIV3.Document {
  return typeof (document as { openapi?: string }).openapi === "string";
}

function isOpenAPIV2Document(document: AnyOpenAPIDocument): document is OpenAPIV2.Document {
  return typeof (document as { swagger?: string }).swagger === "string";
}
