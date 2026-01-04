import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation } from "../ToolInvocation";

afterEach(() => {
  cleanup();
});

test("ToolInvocation displays 'Creating' message for str_replace_editor create command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolInvocation displays 'Editing' message for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/components/Button.tsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Editing /components/Button.tsx")).toBeDefined();
});

test("ToolInvocation displays 'Editing' message for str_replace_editor insert command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/index.tsx", insert_line: 5 }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Editing /index.tsx")).toBeDefined();
});

test("ToolInvocation displays 'Viewing' message for str_replace_editor view command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "view", path: "/config.json" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Viewing /config.json")).toBeDefined();
});

test("ToolInvocation displays 'Undoing' message for str_replace_editor undo_edit command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Undoing changes to /App.jsx")).toBeDefined();
});

test("ToolInvocation displays 'Renaming' message for file_manager rename command", () => {
  render(
    <ToolInvocation
      toolName="file_manager"
      args={{
        command: "rename",
        path: "/old-name.tsx",
        new_path: "/new-name.tsx",
      }}
      state="result"
      result="Success"
    />
  );

  expect(
    screen.getByText("Renaming /old-name.tsx to /new-name.tsx")
  ).toBeDefined();
});

test("ToolInvocation displays 'Deleting' message for file_manager delete command", () => {
  render(
    <ToolInvocation
      toolName="file_manager"
      args={{ command: "delete", path: "/unused-file.tsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Deleting /unused-file.tsx")).toBeDefined();
});

test("ToolInvocation shows green dot when completed", () => {
  const { container } = render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
});

test("ToolInvocation shows loading spinner when in progress", () => {
  const { container } = render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="pending"
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
});

test("ToolInvocation falls back to tool name for unknown tool", () => {
  render(
    <ToolInvocation
      toolName="unknown_tool"
      args={{ some_arg: "value" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolInvocation handles missing new_path in rename command", () => {
  render(
    <ToolInvocation
      toolName="file_manager"
      args={{ command: "rename", path: "/old-name.tsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Renaming /old-name.tsx")).toBeDefined();
});

test("ToolInvocation handles unknown str_replace_editor command", () => {
  render(
    <ToolInvocation
      toolName="str_replace_editor"
      args={{ command: "unknown_command", path: "/test.tsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Modifying /test.tsx")).toBeDefined();
});

test("ToolInvocation handles unknown file_manager command", () => {
  render(
    <ToolInvocation
      toolName="file_manager"
      args={{ command: "unknown_command", path: "/test.tsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Managing /test.tsx")).toBeDefined();
});
