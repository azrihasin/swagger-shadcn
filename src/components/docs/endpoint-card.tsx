import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { ParsedEndpoint, ParsedMedia } from "@/lib/openapi"
import { SchemaViewer } from "./schema-viewer"
import { CodeBlock } from "../code-block"

const methodThemes: Record<string, string> = {
  GET: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  POST: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  PUT: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  PATCH: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
  DELETE: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
}

function getBadgeClasses(method: string) {
  return methodThemes[method] ?? "border-primary/30 bg-primary/10 text-primary"
}

interface ApiEndpointCardProps {
  endpoint: ParsedEndpoint
}

export function ApiEndpointCard({ endpoint }: ApiEndpointCardProps) {
  return (
    <section
      id={endpoint.id}
      className="space-y-4 rounded-xl border border-border/80 bg-card p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={getBadgeClasses(endpoint.method)}>
              {endpoint.method}
            </Badge>
            <code className="rounded bg-muted/60 px-2 py-1 text-sm font-medium text-primary">
              {endpoint.path}
            </code>
            {endpoint.deprecated ? (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Deprecated
              </Badge>
            ) : null}
          </div>
          {endpoint.summary ? (
            <h3 className="text-xl font-semibold text-foreground">{endpoint.summary}</h3>
          ) : null}
          {endpoint.description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {endpoint.description}
            </p>
          ) : null}
        </div>
        {endpoint.tags.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {endpoint.tags.map((tag) => (
              <Badge key={`${endpoint.id}-${tag}`} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <Separator />

      <Accordion type="multiple" className="w-full space-y-3">
        {endpoint.parameters.length > 0 ? (
          <AccordionItem value="parameters" className="rounded-lg border border-border/70 bg-muted/30">
            <AccordionTrigger className="px-4">
              Parameters ({endpoint.parameters.length})
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {endpoint.parameters.map((param) => (
                      <tr key={`${param.in}-${param.name}`} className="bg-background">
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">{param.name}</span>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              {param.in}
                            </span>
                            {param.required ? (
                              <Badge variant="outline" className="w-fit text-xs">
                                Required
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground">
                              {param.schema?.type ?? "any"}
                              {param.schema?.format ? ` (${param.schema.format})` : ""}
                            </span>
                            {param.schema?.enum && param.schema.enum.length > 0 ? (
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="uppercase">Enum:</span>
                                {param.schema.enum.map((value) => (
                                  <span key={`${param.name}-${value}`}>{String(value)}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {param.description ? <p>{param.description}</p> : null}
                            {param.example ? (
                              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-xs text-foreground">
                                {param.example}
                              </pre>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {endpoint.requestBody ? (
          <AccordionItem value="request" className="rounded-lg border border-border/70 bg-muted/30">
            <AccordionTrigger className="px-4">Request body</AccordionTrigger>
            <AccordionContent className="space-y-5 px-4">
              {endpoint.requestBody.description ? (
                <p className="text-sm text-muted-foreground">
                  {endpoint.requestBody.description}
                </p>
              ) : null}
              {endpoint.requestBody.contents.map((content) => (
                <MediaPreview key={content.contentType} media={content} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value="responses" className="rounded-lg border border-border/70 bg-muted/30">
          <AccordionTrigger className="px-4">Responses</AccordionTrigger>
          <AccordionContent className="space-y-5 px-4">
            {endpoint.responses.map((response) => (
              <div
                key={`${endpoint.id}-${response.status}`}
                className="space-y-3 rounded-lg border border-border/60 bg-background/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="neutral" className="w-fit bg-muted/60">
                      Status {response.status}
                    </Badge>
                    {response.description ? (
                      <p className="text-sm text-muted-foreground">
                        {response.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {response.contents.length} content type{response.contents.length === 1 ? "" : "s"}
                  </span>
                </div>
                {response.contents.length > 0 ? (
                  <div className="space-y-4">
                    {response.contents.map((content) => (
                      <MediaPreview key={`${response.status}-${content.contentType}`} media={content} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No content defined.</p>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

interface MediaPreviewProps {
  media: ParsedMedia
}

function MediaPreview({ media }: MediaPreviewProps) {
  const hasSchema = Boolean(media.schema)
  const hasExample = Boolean(media.example)
  const defaultTab = hasSchema ? "schema" : "example"

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-background/90 p-4">
      <div className="flex items-center justify-between">
        <Badge variant="neutral" className="bg-muted/60">
          {media.contentType}
        </Badge>
      </div>
      {hasSchema || hasExample ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList>
            {hasSchema ? <TabsTrigger value="schema">Schema</TabsTrigger> : null}
            {hasExample ? <TabsTrigger value="example">Example</TabsTrigger> : null}
          </TabsList>
          {hasSchema ? (
            <TabsContent value="schema" className="space-y-3">
              {media.schema ? (
                <SchemaViewer schema={media.schema} />
              ) : (
                <p className="text-sm text-muted-foreground">Schema unavailable.</p>
              )}
            </TabsContent>
          ) : null}
          {hasExample ? (
            <TabsContent value="example" className="space-y-3">
              {media.example ? (
                <CodeBlock
                  language={media.language ?? inferLanguage(media.contentType)}
                  value={media.example}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No example provided.</p>
              )}
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        <p className="text-sm text-muted-foreground">No schema or example provided.</p>
      )}
    </div>
  )
}

function inferLanguage(contentType: string) {
  if (contentType.includes("json")) return "json"
  if (contentType.includes("xml")) return "xml"
  if (contentType.includes("yaml") || contentType.includes("yml")) return "yaml"
  if (contentType.includes("html")) return "html"
  return "text"
}
