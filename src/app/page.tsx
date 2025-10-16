import { ModeToggle } from "@/components/mode-toggle";
import { SpecSummaryCard } from "@/components/spec-summary-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-12 px-6 py-16 sm:px-12">
      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 text-left">
          <p className="text-sm font-semibold text-primary">Welcome</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build interfaces faster with Next.js and shadcn/ui.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            This starter comes preconfigured with the App Router, Tailwind CSS, and shadcn
            components. Tweak the theme using the toggle and start shipping components in
            minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Start building</Button>
            <Button variant="outline" size="lg">
              View documentation
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end sm:pt-2">
          <ModeToggle />
        </div>
      </div>

      <SpecSummaryCard className="max-w-3xl" />

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Project kickoff</CardTitle>
          <CardDescription>
            Experiment with a few of the prebuilt components and see the design tokens in action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="Acme product launch" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="overview">Project overview</Label>
            <Textarea
              id="overview"
              placeholder="Describe the goals and impact of the project."
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-background p-4">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-base">
                Status updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Stay notified when important milestones are reached.
              </p>
            </div>
            <Switch id="notifications" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline">Preview theme</Button>
          <Button>Save progress</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
