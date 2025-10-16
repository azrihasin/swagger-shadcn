import { ModeToggle } from "@/components/mode-toggle"
import { ApiEndpointCard } from "@/components/docs/endpoint-card"
import { TagNavigation } from "@/components/docs/tag-navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { parseOpenApiSpec } from "@/lib/openapi"
import { sampleOpenApiDocument } from "@/lib/sample-openapi"

const parsedSpec = parseOpenApiSpec(sampleOpenApiDocument)

export default function Home() {
  const { info, tags, servers } = parsedSpec

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-12 md:px-10">
        <aside className="md:sticky md:top-20 md:h-[calc(100vh-6rem)] md:w-64 md:flex-shrink-0">
          <div className="hidden h-full md:block">
            <TagNavigation tags={tags} />
          </div>
        </aside>

        <section className="flex-1 space-y-10">
          <header className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  API Reference
                </p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {info.title}
                </h1>
              </div>
              <ModeToggle />
            </div>
            {info.description ? (
              <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                {info.description}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              {info.version ? (
                <Badge variant="neutral" className="bg-muted/70">
                  Version {info.version}
                </Badge>
              ) : null}
              {servers.map((server) => (
                <div
                  key={server.url}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {server.description ?? "Server"}
                  </span>
                  <code className="rounded bg-background/80 px-2 py-1 font-mono text-[0.7rem] text-primary">
                    {server.url}
                  </code>
                </div>
              ))}
            </div>
          </header>

          <div className="md:hidden">
            <Separator className="my-2" />
            <div className="flex gap-3 overflow-x-auto pb-3">
              {tags.map((tag) => (
                <a
                  key={tag.slug}
                  href={`#${tag.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tag.name}
                  <Badge variant="outline" className="hidden border-border/70 text-xs sm:inline-flex">
                    {tag.endpoints.length}
                  </Badge>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            {tags.map((tag) => (
              <section key={tag.slug} id={tag.slug} className="space-y-8">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">{tag.name}</h2>
                    <Badge variant="outline" className="border-border/70 text-xs">
                      {tag.endpoints.length} endpoint{tag.endpoints.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {tag.description ? (
                    <p className="max-w-3xl text-sm text-muted-foreground">
                      {tag.description}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-8">
                  {tag.endpoints.map((endpoint) => (
                    <ApiEndpointCard key={`${tag.slug}-${endpoint.id}`} endpoint={endpoint} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
