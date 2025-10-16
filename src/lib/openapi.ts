type UnknownRecord = Record<string, unknown>

type RefObject = { $ref: string }

type RawOperation = UnknownRecord & {
  summary?: string
  description?: string
  deprecated?: boolean
  tags?: unknown
  parameters?: unknown
  requestBody?: unknown
  responses?: unknown
}

type RawParameter = UnknownRecord & {
  name?: string
  in?: string
  required?: boolean
  description?: string
  schema?: unknown
  example?: unknown
}

type RawRequestBody = UnknownRecord & {
  description?: string
  required?: boolean
  content?: unknown
}

type RawResponse = UnknownRecord & {
  description?: string
  content?: unknown
}

type RawMediaType = UnknownRecord & {
  schema?: unknown
  example?: unknown
  examples?: unknown
}

export interface SchemaNode {
  name?: string
  title?: string
  type: string
  format?: string
  description?: string
  enum?: Array<string | number | boolean>
  nullable?: boolean
  required?: boolean
  example?: unknown
  children?: SchemaNode[]
  items?: SchemaNode
  reference?: string
}

export interface ParsedParameter {
  name: string
  in: string
  required: boolean
  description?: string
  schema?: SchemaNode
  example?: string
}

export interface ParsedMedia {
  contentType: string
  schema?: SchemaNode
  example?: string
  language?: string
}

export interface ParsedRequestBody {
  description?: string
  required?: boolean
  contents: ParsedMedia[]
}

export interface ParsedResponse {
  status: string
  description?: string
  contents: ParsedMedia[]
}

export interface ParsedEndpoint {
  id: string
  method: string
  path: string
  summary?: string
  description?: string
  deprecated: boolean
  tags: string[]
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
}

export interface ParsedTag {
  name: string
  description?: string
  slug: string
  endpoints: ParsedEndpoint[]
}

export interface ParsedOpenApiSpec {
  info: {
    title: string
    version?: string
    description?: string
  }
  tags: ParsedTag[]
  servers: Array<{ url: string; description?: string }>
}

type OpenApiDocument = Record<string, unknown>

type BuildSchemaOptions = {
  name?: string
  seen?: Set<string>
  reference?: string
}

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
] as const

type HttpMethod = (typeof HTTP_METHODS)[number]

type TagDefinition = {
  name: string
  description?: string
}

export function parseOpenApiSpec(spec: OpenApiDocument): ParsedOpenApiSpec {
  const title = toString(get(spec, ["info", "title"])) ?? "API Reference"
  const version = toString(get(spec, ["info", "version"]))
  const description = toString(get(spec, ["info", "description"]))

  const tagDefinitions = extractTagDefinitions(get(spec, ["tags"]))

  const tagMap = new Map<string, ParsedTag>()
  const ensureTag = (tagName: string) => {
    if (!tagMap.has(tagName)) {
      const definition = tagDefinitions.find((tag) => tag.name === tagName)
      tagMap.set(tagName, {
        name: tagName,
        description: definition?.description,
        slug: slugify(tagName),
        endpoints: [],
      })
    }
    return tagMap.get(tagName)!
  }

  const rawPaths = get(spec, ["paths"])
  if (isRecord(rawPaths)) {
    for (const [path, pathValue] of Object.entries(rawPaths)) {
      if (!isRecord(pathValue)) continue
      const pathParameters = normalizeParameters(pathValue.parameters, spec)
      for (const method of HTTP_METHODS) {
        const operationValue = pathValue[method]
        if (!operationValue || !isRecord(operationValue)) continue
        const operation = operationValue as RawOperation
        const operationParameters = normalizeParameters(operation.parameters, spec)
        const mergedParameters = mergeParameters(pathParameters, operationParameters)
        const endpoint = buildEndpoint(method, path, operation, mergedParameters, spec)
        const operationTags = toStringArray(operation.tags) ?? ["General"]
        for (const tagName of operationTags) {
          const tag = ensureTag(tagName)
          tag.endpoints.push(endpoint)
        }
      }
    }
  }

  const orderedTags: ParsedTag[] = []
  for (const definition of tagDefinitions) {
    const tag = tagMap.get(definition.name)
    if (tag) orderedTags.push(tag)
  }
  for (const tag of tagMap.values()) {
    if (!orderedTags.includes(tag)) orderedTags.push(tag)
  }

  const servers = extractServers(get(spec, ["servers"]))

  return {
    info: {
      title,
      version,
      description,
    },
    tags: orderedTags,
    servers,
  }
}

function buildEndpoint(
  method: HttpMethod,
  path: string,
  operation: RawOperation,
  parameters: ParsedParameter[],
  spec: OpenApiDocument,
): ParsedEndpoint {
  const id = slugify(`${method} ${path}`)
  const requestBody = parseRequestBody(operation.requestBody, spec)
  const responses = parseResponses(operation.responses, spec)

  return {
    id,
    method: method.toUpperCase(),
    path,
    summary: toString(operation.summary),
    description: toString(operation.description),
    deprecated: Boolean(operation.deprecated),
    tags: toStringArray(operation.tags) ?? [],
    parameters,
    requestBody,
    responses,
  }
}

function normalizeParameters(value: unknown, spec: OpenApiDocument): RawParameter[] {
  if (!Array.isArray(value)) return []
  return value
    .map((parameter) => resolveMaybeRef<UnknownRecord>(parameter, spec))
    .filter(isRecord)
    .map((parameter) => parameter as RawParameter)
    .filter((parameter): parameter is RawParameter => Boolean(parameter.name))
}

function mergeParameters(
  pathParameters: RawParameter[],
  operationParameters: RawParameter[],
): ParsedParameter[] {
  const parameterMap = new Map<string, ParsedParameter>()

  for (const parameter of [...pathParameters, ...operationParameters]) {
    if (!parameter.name) continue
    const key = `${parameter.in ?? "query"}:${parameter.name}`
    const schemaNode = buildSchemaNode(parameter.schema, spec, { name: parameter.name })
    const exampleSource =
      parameter.example ??
      (isRecord(parameter.schema) ? parameter.schema.example : undefined) ??
      (schemaNode && schemaNode.example !== undefined ? schemaNode.example : undefined)
    parameterMap.set(key, {
      name: parameter.name,
      in: typeof parameter.in === "string" ? parameter.in : "query",
      required: Boolean(parameter.required),
      description: toString(parameter.description),
      schema: schemaNode,
      example: exampleSource !== undefined ? formatExample(exampleSource) : undefined,
    })
  }

  return Array.from(parameterMap.values())
}

function parseRequestBody(requestBodyInput: unknown, spec: OpenApiDocument): ParsedRequestBody | undefined {
  const requestBody = resolveMaybeRef<RawRequestBody>(requestBodyInput, spec)
  if (!requestBody || !isRecord(requestBody)) return undefined
  const contents = parseContent(requestBody.content, spec)
  if (contents.length === 0) return undefined
  return {
    description: toString(requestBody.description),
    required: Boolean(requestBody.required),
    contents,
  }
}

function parseResponses(responsesInput: unknown, spec: OpenApiDocument): ParsedResponse[] {
  if (!isRecord(responsesInput)) return []
  const responses: ParsedResponse[] = []
  for (const [status, responseValue] of Object.entries(responsesInput)) {
    const response = resolveMaybeRef<RawResponse>(responseValue, spec)
    if (!response || !isRecord(response)) continue
    const contents = parseContent(response.content, spec)
    responses.push({
      status,
      description: toString(response.description),
      contents,
    })
  }
  responses.sort((a, b) => statusSortValue(a.status) - statusSortValue(b.status))
  return responses
}

function parseContent(content: unknown, spec: OpenApiDocument): ParsedMedia[] {
  if (!isRecord(content)) return []
  const entries: ParsedMedia[] = []
  for (const [contentType, mediaValue] of Object.entries(content)) {
    if (!isRecord(mediaValue)) continue
    const media = mediaValue as RawMediaType
    const schemaNode = buildSchemaNode(media.schema, spec)
    const example = pickExample(media, schemaNode, contentType)
    entries.push({
      contentType,
      schema: schemaNode,
      example,
      language: languageFromContentType(contentType),
    })
  }
  return entries
}

function pickExample(
  media: RawMediaType,
  schema: SchemaNode | undefined,
  contentType: string,
): string | undefined {
  if (media.example !== undefined) {
    return formatExample(media.example, contentType)
  }

  if (isRecord(media.examples)) {
    for (const exampleValue of Object.values(media.examples)) {
      if (isRecord(exampleValue) && "value" in exampleValue) {
        const formatted = formatExample(exampleValue.value, contentType)
        if (formatted !== undefined) return formatted
      } else if (exampleValue !== undefined) {
        const formatted = formatExample(exampleValue, contentType)
        if (formatted !== undefined) return formatted
      }
    }
  }

  const generated = generateExampleFromSchema(schema)
  if (generated !== undefined) {
    return formatExample(generated, contentType)
  }

  return undefined
}

function generateExampleFromSchema(schema: SchemaNode | undefined): unknown {
  if (!schema) return undefined
  if (schema.example !== undefined) return schema.example
  if (schema.enum && schema.enum.length > 0) return schema.enum[0]

  switch (schema.type) {
    case "object": {
      const output: Record<string, unknown> = {}
      for (const child of schema.children ?? []) {
        const value = generateExampleFromSchema(child)
        if (child.name) {
          output[child.name] = value ?? null
        }
      }
      return output
    }
    case "array": {
      const value = generateExampleFromSchema(schema.items)
      return value !== undefined ? [value] : []
    }
    case "integer":
    case "number":
      return 0
    case "boolean":
      return true
    case "null":
      return null
    default:
      return "string"
  }
}

function buildSchemaNode(
  schemaInput: unknown,
  spec: OpenApiDocument,
  options: BuildSchemaOptions = {},
): SchemaNode | undefined {
  if (!schemaInput) return undefined
  const seen = options.seen ?? new Set<string>()

  if (isRefObject(schemaInput)) {
    const ref = schemaInput.$ref
    if (seen.has(ref)) {
      return {
        name: options.name,
        type: "reference",
        reference: ref,
        description: `See ${ref}`,
      }
    }
    const nextSeen = new Set(seen)
    nextSeen.add(ref)
    const resolved = resolveRef(ref, spec)
    if (!resolved) {
      return {
        name: options.name,
        type: "unknown",
        reference: ref,
      }
    }
    const node = buildSchemaNode(resolved, spec, {
      name: options.name,
      seen: nextSeen,
      reference: ref,
    })
    if (node && !node.reference) node.reference = ref
    return node
  }

  if (!isRecord(schemaInput)) return undefined
  const schema = schemaInput

  const allOf = Array.isArray(schema.allOf) ? schema.allOf : undefined
  if (allOf && allOf.length > 0) {
    const merged: UnknownRecord = { ...schema, allOf: undefined }
    for (const part of allOf) {
      const resolved = resolveMaybeRef<UnknownRecord>(part, spec)
      if (!resolved || !isRecord(resolved)) continue
      if (isRecord(resolved.properties)) {
        merged.properties = {
          ...(isRecord(merged.properties) ? (merged.properties as UnknownRecord) : {}),
          ...resolved.properties,
        }
      }
      if (Array.isArray(resolved.required)) {
        const current = Array.isArray(merged.required) ? merged.required : []
        merged.required = Array.from(new Set([...current, ...resolved.required]))
      }
      if (!merged.type && typeof resolved.type === "string") {
        merged.type = resolved.type
      }
    }
    return buildSchemaNode(merged, spec, options)
  }

  const type = determineType(schema)
  const base: SchemaNode = {
    name: options.name ?? toString(schema.title),
    title: toString(schema.title) ?? options.name,
    type,
    format: toString(schema.format),
    description: toString(schema.description),
    enum: Array.isArray(schema.enum) ? schema.enum.filter(isPrimitive) : undefined,
    nullable: Boolean(schema.nullable),
    example: schema.example,
    reference: options.reference,
  }

  if (type === "object") {
    const requiredSet = new Set<string>(
      Array.isArray(schema.required)
        ? schema.required.filter((value): value is string => typeof value === "string")
        : [],
    )
    const propertiesRecord = isRecord(schema.properties) ? schema.properties : undefined
    const children: SchemaNode[] = []
    if (propertiesRecord) {
      for (const [propertyName, propertySchema] of Object.entries(propertiesRecord)) {
        const child = buildSchemaNode(propertySchema, spec, {
          name: propertyName,
          seen: new Set(seen),
        })
        if (child) {
          child.required = requiredSet.has(propertyName)
          children.push(child)
        }
      }
    }
    return { ...base, children }
  }

  if (type === "array") {
    const itemsNode = buildSchemaNode(schema.items, spec, {
      name: isRecord(schema.items) ? toString(schema.items.title) : undefined,
      seen: new Set(seen),
    })
    return { ...base, items: itemsNode }
  }

  return base
}

function determineType(schema: UnknownRecord): string {
  if (typeof schema.type === "string") return schema.type
  if (isRecord(schema.properties)) return "object"
  if (schema.items) return "array"
  if (schema.enum) return "string"
  return "any"
}

function resolveRef(ref: string, spec: OpenApiDocument): unknown {
  if (!ref.startsWith("#/")) return undefined
  const path = ref
    .replace(/^#\//, "")
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
  return get(spec, path)
}

function resolveMaybeRef<T>(value: unknown, spec: OpenApiDocument): T | undefined {
  if (isRefObject(value)) {
    return resolveRef(value.$ref, spec) as T | undefined
  }
  return value as T | undefined
}

function get(source: unknown, path: string[]): unknown {
  let current: unknown = source
  for (const key of path) {
    if (isRecord(current) && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  return current
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function statusSortValue(status: string): number {
  if (status.toLowerCase() === "default") return 10_000
  const numeric = Number(status)
  if (Number.isNaN(numeric)) return 9_999
  return numeric
}

function formatExample(value: unknown, contentType?: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }
  if (contentType && contentType.includes("json")) {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function languageFromContentType(contentType: string): string {
  const normalized = contentType.toLowerCase()
  if (normalized.includes("json")) return "json"
  if (normalized.includes("xml")) return "xml"
  if (normalized.includes("yaml") || normalized.includes("yml")) return "yaml"
  if (normalized.includes("html")) return "html"
  if (normalized.includes("plain")) return "text"
  if (normalized.includes("x-www-form-urlencoded")) return "urlencoded"
  return "text"
}

function extractTagDefinitions(value: unknown): TagDefinition[] {
  if (!Array.isArray(value)) return []
  const tags: TagDefinition[] = []
  for (const entry of value) {
    if (!isRecord(entry)) continue
    const name = toString(entry.name)
    if (!name) continue
    tags.push({
      name,
      description: toString(entry.description),
    })
  }
  return tags
}

function extractServers(value: unknown): Array<{ url: string; description?: string }> {
  if (!Array.isArray(value)) return []
  const servers: Array<{ url: string; description?: string }> = []
  for (const entry of value) {
    if (!isRecord(entry)) continue
    const url = toString(entry.url)
    if (!url) continue
    servers.push({
      url,
      description: toString(entry.description),
    })
  }
  return servers
}

function toString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const result = value.filter((entry): entry is string => typeof entry === "string")
  return result.length > 0 ? result : undefined
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isRefObject(value: unknown): value is RefObject {
  return isRecord(value) && typeof value.$ref === "string"
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return ["string", "number", "boolean"].includes(typeof value)
}
