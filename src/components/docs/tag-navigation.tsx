import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ParsedTag } from "@/lib/openapi"

interface TagNavigationProps {
  tags: ParsedTag[]
}

export function TagNavigation({ tags }: TagNavigationProps) {
  return (
    <ScrollArea className="h-full">
      <nav className="space-y-6 pr-4">
        {tags.map((tag) => (
          <div key={tag.slug} className="space-y-3">
            <Link
              href={`#${tag.slug}`}
              className="block text-sm font-semibold text-foreground hover:text-primary"
            >
              {tag.name}
            </Link>
            {tag.description ? (
              <p className="text-xs text-muted-foreground">{tag.description}</p>
            ) : null}
            <div className="space-y-2">
              {tag.endpoints.map((endpoint) => (
                <Link
                  key={`${tag.slug}-${endpoint.id}`}
                  href={`#${endpoint.id}`}
                  className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <Badge
                    variant="outline"
                    className="min-w-[52px] justify-center border-primary/40 text-primary"
                  >
                    {endpoint.method}
                  </Badge>
                  <span className="truncate" title={endpoint.path}>
                    {endpoint.path}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}
