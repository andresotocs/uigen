import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MainContent } from "../main-content";
import { describe, it, expect, vi } from "vitest";

// Mock the child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

describe("MainContent Toggle Buttons", () => {
  it("should toggle between preview and code view when clicking tabs", async () => {
    const user = userEvent.setup();

    render(<MainContent />);

    // Initially should show preview
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("file-tree")).not.toBeInTheDocument();
    expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();

    // Click on Code tab
    const codeTab = screen.getByRole("tab", { name: /code/i });
    await user.click(codeTab);

    // Should now show code view
    expect(screen.queryByTestId("preview-frame")).not.toBeInTheDocument();
    expect(screen.getByTestId("file-tree")).toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();

    // Click on Preview tab
    const previewTab = screen.getByRole("tab", { name: /preview/i });
    await user.click(previewTab);

    // Should show preview again
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("file-tree")).not.toBeInTheDocument();
    expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
  });
});
