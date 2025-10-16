"use client";

import { useMemo } from "react";

import { useOpenApiSpec } from "@/components/openapi-spec-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SpecSummaryCardProps {
  className?: string;
}

export function SpecSummaryCard({ className }: SpecSummaryCardProps) {
  const { status, data, error, reload } = useOpenApiSpec();

  const tagCount = data?.tags.length ?? 0;
  const pathCount = data?.paths.length ?? 0;
  const operationCount = useMemo(() => {
    if (!data) {
      return 0;
    }

    return data.paths.reduce((total, path) => total + path.operations.length, 0);
  }, [data]);

  if (status === "loading" && !data) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Loading API specification…</CardTitle>
          <CardDescription>Fetching the bundled OpenAPI document.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Unable to load API specification</CardTitle>
          <CardDescription className="space-y-2">
            <p className="text-sm text-muted-foreground">{error?.message ?? "An unexpected error occurred while loading the OpenAPI document."}</p>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void reload()}
            >
              Try again
            </button>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {data.info.title}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            v{data.info.version ?? "0"}
          </span>
        </CardTitle>
        <CardDescription>{data.info.description ?? "No description provided."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric label="Tags" value={tagCount} />
        <SummaryMetric label="Paths" value={pathCount} />
        <SummaryMetric label="Operations" value={operationCount} />
      </CardContent>
    </Card>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
