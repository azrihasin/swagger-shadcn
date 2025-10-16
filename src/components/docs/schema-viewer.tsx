import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SchemaNode } from "@/lib/openapi"

interface SchemaViewerProps {
  schema: SchemaNode
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  return (
    <div className="space-y-3">
      <SchemaNodeItem node={schema} level={0} />
    </div>
  )
}

interface SchemaNodeItemProps {
  node: SchemaNode
  level: number
}

function SchemaNodeItem({ node, level }: SchemaNodeItemProps) {
  const isArray = node.type === "array"

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-border/70 bg-card/60 p-4",
        level > 0 && "bg-background/70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {node.name ? (
              <span className="font-semibold text-foreground">{node.name}</span>
            ) : null}
            {node.required ? <Badge variant="outline">Required</Badge> : null}
            {node.nullable ? <Badge variant="outline">Nullable</Badge> : null}
            {node.reference ? (
              <Badge variant="outline" className="bg-muted/40">
                {node.reference.replace("#/components/schemas/", "")}
              </Badge>
            ) : null}
          </div>
          {node.description ? (
            <p className="max-w-3xl text-sm text-muted-foreground">{node.description}</p>
          ) : null}
          {node.enum && node.enum.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Enum</span>
              <div className="flex flex-wrap gap-2">
                {node.enum.map((value, index) => (
                  <Badge key={`${node.name ?? "enum"}-${index}`} variant="neutral">
                    {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {node.example !== undefined ? (
            <p className="text-sm text-muted-foreground">
              Example: <span className="font-medium text-foreground">{String(node.example)}</span>
            </p>
          ) : null}
        </div>
        <Badge variant="neutral">
          {isArray ? "Array" : "Type"}: {node.type}
          {node.format ? ` (${node.format})` : ""}
        </Badge>
      </div>

      {node.type === "array" && node.items ? (
        <div className="space-y-2 rounded-md border border-dashed border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Items</p>
          <SchemaNodeItem node={node.items} level={level + 1} />
        </div>
      ) : null}

      {node.children && node.children.length > 0 ? (
        <div className="space-y-3">
          {node.children.map((child, index) => (
            <div
              key={`${child.name ?? child.type}-${index}`}
              className="border-l border-border/60 pl-3"
            >
              <SchemaNodeItem node={child} level={level + 1} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
