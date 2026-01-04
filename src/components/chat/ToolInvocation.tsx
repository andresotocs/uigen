"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function getToolMessage(
  toolName: string,
  args: Record<string, unknown>
): string {
  if (toolName === "str_replace_editor") {
    const command = args.command as string;
    const path = args.path as string;

    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
        return `Editing ${path}`;
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Viewing ${path}`;
      case "undo_edit":
        return `Undoing changes to ${path}`;
      default:
        return `Modifying ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string;
    const path = args.path as string;
    const newPath = args.new_path as string;

    switch (command) {
      case "rename":
        return newPath ? `Renaming ${path} to ${newPath}` : `Renaming ${path}`;
      case "delete":
        return `Deleting ${path}`;
      default:
        return `Managing ${path}`;
    }
  }

  return toolName;
}

export function ToolInvocation({
  toolName,
  args,
  state,
  result,
}: ToolInvocationProps) {
  const message = getToolMessage(toolName, args);
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
