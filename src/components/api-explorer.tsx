"use client"

import * as React from "react"
import { Loader2, Play, RotateCcw } from "lucide-react"
import { useForm, type UseFormReturn } from "react-hook-form"

import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ApiParameter = {
  name: string
  description?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
}

type ApiEndpoint = {
  id: string
  title: string
  method: HttpMethod
  path: string
  baseUrl: string
  description?: string
  parameters?: {
    path?: ApiParameter[]
    query?: ApiParameter[]
    header?: ApiParameter[]
  }
  requestBody?: {
    required?: boolean
    description?: string
    example?: string
    contentType?: string
  }
}

type EndpointFormValues = {
  baseUrl: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headerParams: Record<string, string>
  body: string
  authType: "none" | "apiKeyHeader" | "apiKeyQuery" | "bearer"
  authKeyName: string
  authValue: string
}

type RequestPreview = {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
}

type ResponsePreview = {
  status?: number
  statusText?: string
  ok?: boolean
  time?: number
  headers: Record<string, string>
  body?: string
  error?: string
}

const HTTP_METHOD_BADGE: Record<HttpMethod, BadgeProps["variant"]> = {
  DELETE: "destructive",
  GET: "success",
  PATCH: "info",
  POST: "info",
  PUT: "info",
}

const endpoints: ApiEndpoint[] = [
  {
    id: "get-post",
    title: "Retrieve post",
    method: "GET",
    path: "/posts/{id}",
    baseUrl: "https://jsonplaceholder.typicode.com",
    description:
      "Fetch a JSONPlaceholder post by id. Supports optional expansions and custom headers.",
    parameters: {
      path: [
        {
          name: "id",
          description: "Numeric identifier of the post to fetch.",
          required: true,
          placeholder: "1",
          defaultValue: "1",
        },
      ],
      query: [
        {
          name: "_expand",
          description: "Include related resources such as the author.",
          placeholder: "user",
        },
        {
          name: "_delay",
          description:
            "Artificial delay (ms) useful for testing loading states.",
          placeholder: "500",
        },
      ],
      header: [
        {
          name: "X-Trace-Id",
          description: "Optional trace identifier for correlating logs.",
          placeholder: "demo-123",
        },
      ],
    },
  },
  {
    id: "create-post",
    title: "Create post",
    method: "POST",
    path: "/posts",
    baseUrl: "https://jsonplaceholder.typicode.com",
    description:
      "Create a new JSONPlaceholder post. The API echoes the payload and returns a fake id.",
    parameters: {
      header: [
        {
          name: "X-App-Version",
          description: "Identifies the client build making the request.",
          placeholder: "1.0.0",
        },
      ],
    },
    requestBody: {
      required: true,
      description: "Supply the post payload as JSON.",
      contentType: "application/json; charset=UTF-8",
      example: JSON.stringify(
        {
          title: "Demo post",
          body: "Generated from the interactive client.",
          userId: 1,
        },
        null,
        2,
      ),
    },
  },
  {
    id: "list-users",
    title: "List users",
    method: "GET",
    path: "/users",
    baseUrl: "https://jsonplaceholder.typicode.com",
    description:
      "List users with optional filtering. Demonstrates query and header parameters without a request body.",
    parameters: {
      query: [
        {
          name: "username",
          description: "Filters users by username.",
          placeholder: "Bret",
        },
      ],
      header: [
        {
          name: "X-Debug-Mode",
          description: "Toggle verbose logging on the server if supported.",
          placeholder: "true",
        },
      ],
    },
  },
]

export function ApiExplorer() {
  const [selectedEndpointId, setSelectedEndpointId] = React.useState(
    endpoints[0]?.id ?? "",
  )

  const selectedEndpoint = React.useMemo(
    () =>
      endpoints.find((endpoint) => endpoint.id === selectedEndpointId) ??
      endpoints[0],
    [selectedEndpointId],
  )

  if (!selectedEndpoint) {
    return null
  }

  return (
    <section id="api-explorer" className="w-full space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-semibold tracking-tight">
          Interactive API explorer
        </h2>
        <p className="text-muted-foreground">
          Configure parameters, supply authentication, and execute live requests
          without leaving the documentation.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Endpoints</CardTitle>
            <CardDescription>
              Choose an endpoint to populate the request form.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {endpoints.map((endpoint) => {
              const isActive = endpoint.id === selectedEndpoint.id

              return (
                <Button
                  key={endpoint.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 border border-transparent text-left transition-all",
                    isActive
                      ? "border-primary bg-primary/10 font-semibold hover:bg-primary/20"
                      : "hover:border-border hover:bg-accent/60",
                  )}
                  onClick={() => setSelectedEndpointId(endpoint.id)}
                >
                  <MethodBadge method={endpoint.method} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {endpoint.title}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {endpoint.path}
                    </p>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>
        <EndpointTryIt key={selectedEndpoint.id} endpoint={selectedEndpoint} />
      </div>
    </section>
  )
}

type EndpointTryItProps = {
  endpoint: ApiEndpoint
}

function EndpointTryIt({ endpoint }: EndpointTryItProps) {
  const defaultValues = React.useMemo(
    () => createDefaultValues(endpoint),
    [endpoint],
  )

  const form = useForm<EndpointFormValues>({
    mode: "onSubmit",
    defaultValues,
  })

  const [requestPreview, setRequestPreview] = React.useState<RequestPreview | null>(
    null,
  )
  const [responsePreview, setResponsePreview] = React.useState<ResponsePreview | null>(
    null,
  )
  const [isLoading, setIsLoading] = React.useState(false)

  const authType = form.watch("authType")

  React.useEffect(() => {
    form.reset(defaultValues)
    setRequestPreview(null)
    setResponsePreview(null)
    setIsLoading(false)
    form.clearErrors()
  }, [defaultValues, form])

  React.useEffect(() => {
    if (authType === "none") {
      form.clearErrors(["authKeyName", "authValue"])
    }
  }, [authType, form])

  const handleRequest = async (values: EndpointFormValues) => {
    setIsLoading(true)
    setResponsePreview(null)

    const requestHeaders: Record<string, string> = {}

    for (const param of endpoint.parameters?.header ?? []) {
      const value = values.headerParams?.[param.name]?.trim()
      if (value) {
        requestHeaders[param.name] = value
      }
    }

    const authKey = values.authKeyName?.trim()
    const authValue = values.authValue?.trim()

    if (values.authType === "apiKeyHeader") {
      if (!authKey) {
        form.setError("authKeyName", {
          type: "manual",
          message: "Provide the header name for your API key.",
        })
      }
      if (!authValue) {
        form.setError("authValue", {
          type: "manual",
          message: "Provide the API key value to send.",
        })
      }
      if (!authKey || !authValue) {
        setIsLoading(false)
        return
      }

      requestHeaders[authKey] = authValue
    } else if (values.authType === "apiKeyQuery") {
      if (!authKey) {
        form.setError("authKeyName", {
          type: "manual",
          message: "Provide the query string key for your API key.",
        })
      }
      if (!authValue) {
        form.setError("authValue", {
          type: "manual",
          message: "Provide the API key value to send.",
        })
      }
      if (!authKey || !authValue) {
        setIsLoading(false)
        return
      }
    } else if (values.authType === "bearer") {
      if (!authValue) {
        form.setError("authValue", {
          type: "manual",
          message: "Provide the bearer token to attach.",
        })
        setIsLoading(false)
        return
      }

      requestHeaders.Authorization = `Bearer ${authValue}`
    }

    let normalizedBase = values.baseUrl.trim()
    if (!normalizedBase) {
      form.setError("baseUrl", {
        type: "manual",
        message: "Enter the base URL for the request.",
      })
      setIsLoading(false)
      return
    }

    let substitutedPath = endpoint.path
    substitutedPath = substitutedPath.replace(/\{([^}]+)\}/g, (_, key: string) => {
      const value = values.pathParams?.[key] ?? ""
      return encodeURIComponent(value)
    })
    substitutedPath = substitutedPath.replace(/\/{2,}/g, "/")

    if (!substitutedPath.startsWith("/")) {
      substitutedPath = `/${substitutedPath}`
    }

    if (normalizedBase.endsWith("/")) {
      normalizedBase = normalizedBase.slice(0, -1)
    }

    let url: URL
    try {
      url = new URL(`${normalizedBase}${substitutedPath}`)
    } catch {
      form.setError("baseUrl", {
        type: "manual",
        message: "Base URL must be a valid absolute URL (https://example.com).",
      })
      setIsLoading(false)
      return
    }

    for (const param of endpoint.parameters?.query ?? []) {
      const value = values.queryParams?.[param.name]?.trim()
      if (value) {
        url.searchParams.set(param.name, value)
      }
    }

    if (values.authType === "apiKeyQuery" && authKey && authValue) {
      url.searchParams.set(authKey, authValue)
    }

    const rawBody = values.body?.trim()
    const expectsJson = endpoint.requestBody?.contentType
      ? endpoint.requestBody.contentType.includes("json")
      : true

    let requestBody: string | undefined
    let requestBodyPreview: string | undefined

    if (rawBody && !["GET", "HEAD"].includes(endpoint.method)) {
      if (expectsJson) {
        try {
          const parsed = JSON.parse(rawBody)
          requestBody = JSON.stringify(parsed)
          requestBodyPreview = JSON.stringify(parsed, null, 2)
        } catch {
          form.setError("body", {
            type: "manual",
            message: "Body must be valid JSON.",
          })
          setIsLoading(false)
          return
        }
      } else {
        requestBody = rawBody
        requestBodyPreview = rawBody
      }
    }

    if (
      requestBody &&
      !Object.keys(requestHeaders).some(
        (header) => header.toLowerCase() === "content-type",
      )
    ) {
      requestHeaders["Content-Type"] =
        endpoint.requestBody?.contentType ?? "application/json"
    }

    const finalUrl = url.toString()

    setRequestPreview({
      method: endpoint.method,
      url: finalUrl,
      headers: { ...requestHeaders },
      body: requestBodyPreview,
    })

    const requestInit: RequestInit = {
      method: endpoint.method,
      headers: requestHeaders,
    }

    if (requestBody) {
      requestInit.body = requestBody
    }

    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now()

    try {
      const response = await fetch(finalUrl, requestInit)
      const end =
        typeof performance !== "undefined" ? performance.now() : Date.now()

      const elapsed = Math.max(0, end - start)
      const text = await response.text()
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const formattedBody = text ? formatMaybeJson(text) : undefined

      setResponsePreview({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        time: elapsed,
        headers: responseHeaders,
        body: formattedBody,
      })
    } catch (error) {
      const end =
        typeof performance !== "undefined" ? performance.now() : Date.now()
      const elapsed = Math.max(0, end - start)

      setResponsePreview({
        ok: false,
        time: elapsed,
        headers: {},
        error:
          error instanceof Error
            ? error.message
            : "Request failed before receiving a response.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-fit border shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <CardTitle className="text-xl font-semibold text-foreground">
            {endpoint.title}
          </CardTitle>
        </div>
        {endpoint.description ? (
          <CardDescription>{endpoint.description}</CardDescription>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{endpoint.path}</span>
          <span aria-hidden>•</span>
          <span>{endpoint.baseUrl}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(handleRequest)}
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Endpoint target
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Define the base URL and supply any required path parameters.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    rules={{
                      required: "Base URL is required.",
                      validate: (value) => {
                        try {
                          const trimmed = value?.trim()
                          if (!trimmed) {
                            return "Base URL is required."
                          }
                          new URL(trimmed)
                          return true
                        } catch {
                          return "Enter a valid absolute URL (https://example.com)."
                        }
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="https://jsonplaceholder.typicode.com"
                          />
                        </FormControl>
                        <FormDescription>
                          The destination host used when constructing the
                          request.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <ParameterSection
                title="Path parameters"
                description="Replace templated segments (e.g. {id}) with concrete values."
                emptyMessage="This endpoint does not define path parameters."
                parameters={endpoint.parameters?.path}
                fieldPrefix="pathParams"
                form={form}
              />

              <Separator />

              <ParameterSection
                title="Query parameters"
                description="Attach optional search parameters to filter or expand the results."
                emptyMessage="No query parameters are available for this endpoint."
                parameters={endpoint.parameters?.query}
                fieldPrefix="queryParams"
                form={form}
              />

              <Separator />

              <ParameterSection
                title="Headers"
                description="Send additional headers such as trace identifiers or custom metadata."
                emptyMessage="This endpoint does not require custom headers."
                parameters={endpoint.parameters?.header}
                fieldPrefix="headerParams"
                form={form}
              />

              <Separator />

              <RequestBodySection endpoint={endpoint} form={form} />

              <Separator />

              <AuthenticationSection authType={authType} form={form} />
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  form.reset(defaultValues)
                  setRequestPreview(null)
                  setResponsePreview(null)
                  form.clearErrors()
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                {isLoading ? "Sending" : "Send request"}
              </Button>
            </div>
          </form>
        </Form>

        <Separator />

        <div className="grid gap-6 lg:grid-cols-2">
          <RequestPreviewPanel method={endpoint.method} request={requestPreview} />
          <ResponsePreviewPanel response={responsePreview} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  )
}

type ParameterSectionProps = {
  title: string
  description: string
  emptyMessage: string
  parameters?: ApiParameter[]
  fieldPrefix: "pathParams" | "queryParams" | "headerParams"
  form: UseFormReturn<EndpointFormValues>
}

function ParameterSection({
  title,
  description,
  emptyMessage,
  parameters,
  fieldPrefix,
  form,
}: ParameterSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {parameters && parameters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {parameters.map((param) => (
            <FormField
              key={`${fieldPrefix}-${param.name}`}
              control={form.control}
              name={`${fieldPrefix}.${param.name}` as const}
              rules={
                param.required
                  ? {
                      required: `${param.name} is required.`,
                    }
                  : undefined
              }
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <span>{param.name}</span>
                    {param.required ? (
                      <span className="text-destructive">*</span>
                    ) : null}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={param.placeholder}
                    />
                  </FormControl>
                  {param.description ? (
                    <FormDescription>{param.description}</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  )
}

type RequestBodySectionProps = {
  endpoint: ApiEndpoint
  form: UseFormReturn<EndpointFormValues>
}

function RequestBodySection({ endpoint, form }: RequestBodySectionProps) {
  if (!endpoint.requestBody) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Request body
          </h3>
          <p className="text-sm text-muted-foreground">
            This operation does not define a request body.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Request body
        </h3>
        <p className="text-sm text-muted-foreground">
          {endpoint.requestBody.description ??
            "Provide the payload that will be sent with the request."}
        </p>
      </div>
      <FormField
        control={form.control}
        name="body"
        rules={
          endpoint.requestBody.required
            ? {
                required: "A request body is required for this endpoint.",
              }
            : undefined
        }
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Request body</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={6}
                placeholder={
                  endpoint.requestBody?.example
                    ? undefined
                    : "{\n  \"key\": \"value\"\n}"
                }
              />
            </FormControl>
            <FormDescription>
              {endpoint.requestBody.contentType
                ? `Content type: ${endpoint.requestBody.contentType}. `
                : null}
              {endpoint.requestBody.example
                ? "An example payload has been pre-filled for convenience."
                : "Enter raw text or JSON to include in the request body."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

type AuthenticationSectionProps = {
  authType: EndpointFormValues["authType"]
  form: UseFormReturn<EndpointFormValues>
}

function AuthenticationSection({ authType, form }: AuthenticationSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Authentication
        </h3>
        <p className="text-sm text-muted-foreground">
          Attach API keys or bearer tokens to authenticate sample requests.
        </p>
      </div>
      <FormField
        control={form.control}
        name="authType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strategy</FormLabel>
            <FormControl>
              <select
                {...field}
                value={field.value}
                className="border-input flex h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
              >
                <option value="none">No authentication</option>
                <option value="apiKeyHeader">API key (header)</option>
                <option value="apiKeyQuery">API key (query)</option>
                <option value="bearer">Bearer token</option>
              </select>
            </FormControl>
            <FormDescription>
              Choose how credentials should be injected into the test request.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {authType === "none" ? (
        <p className="text-sm text-muted-foreground">
          No authentication data will be included when the request executes.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {authType !== "bearer" ? (
            <FormField
              control={form.control}
              name="authKeyName"
              rules={{
                required:
                  authType === "apiKeyHeader" || authType === "apiKeyQuery"
                    ? "Provide the key name to send."
                    : false,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {authType === "apiKeyQuery" ? "Query key" : "Header name"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={
                        authType === "apiKeyQuery" ? "api_key" : "X-API-Key"
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The parameter name that will carry the API key value.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="authValue"
            rules={{
              required: authType !== "none" ? "Provide the credential value." : false,
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {authType === "bearer" ? "Bearer token" : "Credential value"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder={
                      authType === "bearer" ? "eyJhbGciOi..." : "sk_live_123"
                    }
                  />
                </FormControl>
                <FormDescription>
                  Added to the request {authType === "bearer" ? "as an Authorization header." : "before the request is sent."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}

type RequestPreviewPanelProps = {
  method: HttpMethod
  request: RequestPreview | null
}

function RequestPreviewPanel({ method, request }: RequestPreviewPanelProps) {
  const hasHeaders = request && Object.keys(request.headers).length > 0

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Request preview
        </p>
        <MethodBadge method={method} />
      </div>
      {request ? (
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-foreground">URL</p>
            <p className="break-all rounded-md bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground">
              {request.url}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Headers</p>
            {hasHeaders ? (
              <pre className="max-h-48 overflow-auto rounded-md bg-background p-3 text-xs shadow-inner">
                {JSON.stringify(request.headers, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                No additional headers will be sent.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Body</p>
            {request.body ? (
              <pre className="max-h-48 overflow-auto rounded-md bg-background p-3 text-xs shadow-inner">
                {request.body}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                This request does not include a body.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Complete the form and execute a request to preview the payload that
          will be sent.
        </p>
      )}
    </div>
  )
}

type ResponsePreviewPanelProps = {
  response: ResponsePreview | null
  isLoading: boolean
}

function ResponsePreviewPanel({ response, isLoading }: ResponsePreviewPanelProps) {
  const statusVariant: BadgeProps["variant"] = response?.status
    ? response.ok
      ? "success"
      : "destructive"
    : response?.error
      ? "destructive"
      : "muted"

  const statusLabel = response?.status
    ? `${response.status} ${response.statusText ?? ""}`.trim()
    : response?.error
    ? "Request failed"
    : isLoading
    ? "Awaiting response"
    : "No response yet"

  const timeLabel =
    typeof response?.time === "number"
      ? `${Math.round(response.time)} ms`
      : undefined

  const hasHeaders = response && Object.keys(response.headers).length > 0

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Response preview
        </p>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          {timeLabel ? <Badge variant="outline">{timeLabel}</Badge> : null}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Sending request…
        </div>
      ) : response ? (
        <div className="space-y-4 text-sm">
          {response.error ? (
            <p className="text-sm font-medium text-destructive">
              {response.error}
            </p>
          ) : null}
          <div className="space-y-1">
            <p className="font-medium text-foreground">Headers</p>
            {hasHeaders ? (
              <pre className="max-h-48 overflow-auto rounded-md bg-background p-3 text-xs shadow-inner">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                No response headers were returned or could be read.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Body</p>
            {response.body ? (
              <pre className="max-h-72 overflow-auto rounded-md bg-background p-3 text-xs shadow-inner">
                {response.body}
              </pre>
            ) : response.error ? (
              <p className="text-xs text-muted-foreground">
                The request failed before a response body was received.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This response did not include a body.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Execute a request to inspect the response details including status,
          headers, and body.
        </p>
      )}
    </div>
  )
}

function MethodBadge({ method }: { method: HttpMethod }) {
  const variant = HTTP_METHOD_BADGE[method] ?? "secondary"

  return (
    <Badge
      variant={variant}
      className="font-mono text-[0.65rem] uppercase tracking-wide"
    >
      {method}
    </Badge>
  )
}

function createDefaultValues(endpoint: ApiEndpoint): EndpointFormValues {
  return {
    baseUrl: endpoint.baseUrl,
    pathParams: buildDefaultRecord(endpoint.parameters?.path),
    queryParams: buildDefaultRecord(endpoint.parameters?.query),
    headerParams: buildDefaultRecord(endpoint.parameters?.header),
    body: endpoint.requestBody?.example ?? "",
    authType: "none",
    authKeyName: "X-API-Key",
    authValue: "",
  }
}

function buildDefaultRecord(parameters?: ApiParameter[]) {
  return (
    parameters?.reduce<Record<string, string>>((acc, param) => {
      acc[param.name] = param.defaultValue ?? ""
      return acc
    }, {}) ?? {}
  )
}

function formatMaybeJson(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}
