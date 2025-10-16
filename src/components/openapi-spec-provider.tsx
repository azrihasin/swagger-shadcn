"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  loadOpenApiDocument,
  normalizeOpenApiDocument,
  type LoadOpenApiDocumentOptions,
  type NormalizedOpenAPISpec,
  type SpecSource,
} from "@/lib/openapi";

export type OpenApiSpecStatus = "idle" | "loading" | "loaded" | "error";

export interface OpenApiSpecContextValue {
  status: OpenApiSpecStatus;
  data: NormalizedOpenAPISpec | null;
  error: Error | null;
  reload: () => Promise<void>;
}

const OpenApiSpecContext = createContext<OpenApiSpecContextValue | undefined>(undefined);

export interface OpenApiSpecProviderProps {
  source: SpecSource;
  children: React.ReactNode;
  autoLoad?: boolean;
  loaderOptions?: LoadOpenApiDocumentOptions;
}

interface InternalState {
  status: OpenApiSpecStatus;
  data: NormalizedOpenAPISpec | null;
  error: Error | null;
}

export function OpenApiSpecProvider({
  source,
  children,
  autoLoad = true,
  loaderOptions,
}: OpenApiSpecProviderProps) {
  const [state, setState] = useState<InternalState>(() => ({
    status: autoLoad ? "loading" : "idle",
    data: null,
    error: null,
  }));

  const sourceRef = useRef<SpecSource>(source);
  const loaderOptionsRef = useRef<LoadOpenApiDocumentOptions | undefined>(loaderOptions);
  const sourceSignature = useMemo(() => JSON.stringify(source), [source]);
  const optionsSignature = useMemo(() => (loaderOptions ? JSON.stringify(loaderOptions) : null), [loaderOptions]);
  const sourceSignatureRef = useRef(sourceSignature);
  const lastLoadedSignatureRef = useRef<string | null>(null);
  const lastRequestedSignatureRef = useRef<string | null>(null);
  const lastRequestedOptionsSignatureRef = useRef<string | null>(null);

  const performLoad = useCallback(async () => {
    const signature = sourceSignatureRef.current;

    setState((previous) => ({
      status: "loading",
      data: lastLoadedSignatureRef.current === signature ? previous.data : null,
      error: null,
    }));

    try {
      const document = await loadOpenApiDocument(sourceRef.current, loaderOptionsRef.current);
      const normalized = normalizeOpenApiDocument(document);

      lastLoadedSignatureRef.current = signature;

      setState({
        status: "loaded",
        data: normalized,
        error: null,
      });
    } catch (error) {
      setState({
        status: "error",
        data: null,
        error: error instanceof Error ? error : new Error("Failed to load OpenAPI specification"),
      });
    }
  }, []);

  useEffect(() => {
    sourceRef.current = source;
    loaderOptionsRef.current = loaderOptions;
    sourceSignatureRef.current = sourceSignature;

    const hasSourceChanged = lastRequestedSignatureRef.current !== sourceSignature;
    const hasOptionsChanged = lastRequestedOptionsSignatureRef.current !== optionsSignature;

    if (autoLoad && (hasSourceChanged || hasOptionsChanged || lastRequestedSignatureRef.current === null)) {
      lastRequestedSignatureRef.current = sourceSignature;
      lastRequestedOptionsSignatureRef.current = optionsSignature;
      void performLoad();
    } else if (!autoLoad) {
      setState((previous) => ({
        status: "idle",
        data: hasSourceChanged || hasOptionsChanged ? null : previous.data,
        error: null,
      }));
      lastRequestedSignatureRef.current = null;
      lastRequestedOptionsSignatureRef.current = null;
    }
  }, [autoLoad, loaderOptions, optionsSignature, performLoad, source, sourceSignature]);

  const reload = useCallback(async () => {
    await performLoad();
  }, [performLoad]);

  const value = useMemo<OpenApiSpecContextValue>(
    () => ({
      status: state.status,
      data: state.data,
      error: state.error,
      reload,
    }),
    [state, reload],
  );

  return <OpenApiSpecContext.Provider value={value}>{children}</OpenApiSpecContext.Provider>;
}

export function useOpenApiSpec(): OpenApiSpecContextValue {
  const context = useContext(OpenApiSpecContext);

  if (!context) {
    throw new Error("useOpenApiSpec must be used within an OpenApiSpecProvider");
  }

  return context;
}

export function useOpenApiSpecData(): NormalizedOpenAPISpec | null {
  const { data } = useOpenApiSpec();

  return data;
}
