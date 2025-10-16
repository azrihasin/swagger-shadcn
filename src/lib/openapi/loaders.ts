import YAML from "yaml";
import type { AnyOpenAPIDocument } from "./types";

export type SpecFormat = "json" | "yaml";

export type SpecSource =
  | { type: "url"; url: string; requestInit?: RequestInit; format?: SpecFormat }
  | { type: "file"; path: string; format?: SpecFormat }
  | { type: "document"; document: AnyOpenAPIDocument };

export interface LoadOpenApiDocumentOptions {
  fetcher?: typeof fetch;
  format?: SpecFormat;
}

export async function loadOpenApiDocument(
  source: SpecSource,
  options: LoadOpenApiDocumentOptions = {},
): Promise<AnyOpenAPIDocument> {
  if (source.type === "document") {
    return source.document;
  }

  if (source.type === "url") {
    return loadFromUrl(source, options);
  }

  return loadFromFile(source, options);
}

async function loadFromUrl(
  source: Extract<SpecSource, { type: "url" }>,
  options: LoadOpenApiDocumentOptions,
): Promise<AnyOpenAPIDocument> {
  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("A fetch implementation is required to load OpenAPI specs from a URL");
  }

  const response = await fetcher(source.url, source.requestInit);

  if (!response.ok) {
    throw new Error(`Failed to load OpenAPI spec from URL: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const format =
    source.format ??
    options.format ??
    inferFormatFromContentType(response.headers.get("content-type")) ??
    inferFormatFromPath(source.url);

  return parseDocument(text, format);
}

async function loadFromFile(
  source: Extract<SpecSource, { type: "file" }>,
  options: LoadOpenApiDocumentOptions,
): Promise<AnyOpenAPIDocument> {
  const format = source.format ?? options.format ?? inferFormatFromPath(source.path);

  if (typeof window === "undefined") {
    const [{ readFile }, pathModule] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);

    const resolvedPath = source.path.startsWith("/")
      ? source.path
      : pathModule.join(process.cwd(), source.path);

    const fileContents = await readFile(resolvedPath, "utf-8");

    return parseDocument(fileContents, format);
  }

  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("A fetch implementation is required to load OpenAPI specs on the client");
  }

  const response = await fetcher(source.path);

  if (!response.ok) {
    throw new Error(`Failed to load OpenAPI spec from path: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  return parseDocument(text, format);
}

function parseDocument(text: string, explicitFormat?: SpecFormat | null): AnyOpenAPIDocument {
  const trimmed = text.trim();
  const format = explicitFormat ?? inferFormatFromContent(trimmed);

  if (format === "json") {
    return JSON.parse(trimmed) as AnyOpenAPIDocument;
  }

  return YAML.parse(trimmed) as AnyOpenAPIDocument;
}

function inferFormatFromPath(path: string | undefined | null): SpecFormat | null {
  if (!path) return null;

  const lower = path.toLowerCase();

  if (lower.endsWith(".json")) {
    return "json";
  }

  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    return "yaml";
  }

  return null;
}

function inferFormatFromContentType(contentType: string | null): SpecFormat | null {
  if (!contentType) return null;

  if (contentType.includes("json")) {
    return "json";
  }

  if (contentType.includes("yaml") || contentType.includes("yml")) {
    return "yaml";
  }

  return null;
}

function inferFormatFromContent(content: string): SpecFormat {
  if (!content) {
    return "json";
  }

  const firstChar = content[0];

  if (firstChar === "{" || firstChar === "[") {
    return "json";
  }

  return "yaml";
}
