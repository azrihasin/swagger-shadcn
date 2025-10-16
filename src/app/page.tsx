import { ApiExplorer } from "@/components/api-explorer"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-12 px-6 py-16 sm:px-12">
      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 text-left">
          <p className="text-sm font-semibold text-primary">API explorer</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Ship interactive API docs with Next.js and shadcn/ui.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Compose beautiful endpoint pages, wire up authentication, and let consumers try
            real requests without leaving your documentation.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#api-explorer">Open the try it out</a>
            </Button>
            <Button variant="outline" size="lg">
              Browse components
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end sm:pt-2">
          <ModeToggle />
        </div>
      </div>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Plan your integration guide</CardTitle>
          <CardDescription>
            Capture the essentials for a new use case before sharing it alongside the interactive
            explorer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="guide-title">Guide title</Label>
            <Input id="guide-title" placeholder="Billing integration quickstart" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="guide-overview">Summary</Label>
            <Textarea
              id="guide-overview"
              placeholder="Outline the workflow, prerequisites, and expected responses."
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-background p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auth-callout" className="text-base">
                Highlight auth requirements
              </Label>
              <p className="text-sm text-muted-foreground">
                Call out when consumers need to provide API keys or bearer tokens.
              </p>
            </div>
            <Switch id="auth-callout" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline">Preview guide</Button>
          <Button>Save draft</Button>
        </CardFooter>
      </Card>

      <Separator className="w-full" />

      <ApiExplorer />
    </main>
  )
}
