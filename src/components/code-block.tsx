"use client"

import * as React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { duotoneDark, duotoneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export interface CodeBlockProps {
  language: string
  value: string
  className?: string
}

const darkTheme = duotoneDark
const lightTheme = duotoneLight

export function CodeBlock({ language, value, className }: CodeBlockProps) {
  const { resolvedTheme } = useTheme()

  return (
    <SyntaxHighlighter
      language={language}
      style={resolvedTheme === "dark" ? darkTheme : lightTheme}
      wrapLongLines
      customStyle={{
        margin: 0,
        borderRadius: "var(--radius-sm)",
        fontSize: "0.875rem",
        padding: "1rem",
        background: "transparent",
      }}
      className={cn(
        "rounded-md border border-border/60 bg-muted/40 text-sm shadow-inner",
        className,
      )}
    >
      {value}
    </SyntaxHighlighter>
  )
}
