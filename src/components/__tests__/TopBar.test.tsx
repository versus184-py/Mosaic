import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "../ui/TopBar";
import { useUIStore } from "../../store/uiStore";

describe("TopBar", () => {
  beforeEach(() => {
    useUIStore.setState({
      model: "mistral-large-latest",
      settingsOpen: false,
      searchOpen: false,
      showBookmarksOnly: false,
    });
  });

  it("renders the Mosaic title", () => {
    render(<TopBar onNewChat={() => {}} />);
    expect(screen.getByText("◉ Mosaic")).toBeTruthy();
  });

  it("renders the current model name", () => {
    render(<TopBar onNewChat={() => {}} />);
    expect(screen.getByText("Mistral Large")).toBeTruthy();
  });

  it("renders action buttons", () => {
    render(<TopBar onNewChat={() => {}} />);
    expect(screen.getByTitle("Search (Ctrl+F)")).toBeTruthy();
    expect(screen.getByTitle("Documents (RAG)")).toBeTruthy();
    expect(screen.getByTitle("Analytics")).toBeTruthy();
    expect(screen.getByTitle("New thread")).toBeTruthy();
    expect(screen.getByTitle("Settings")).toBeTruthy();
  });

  it("opens model dropdown on click", async () => {
    const user = userEvent.setup();
    render(<TopBar onNewChat={() => {}} />);
    const trigger = screen.getByText("Mistral Large").closest("button")!;
    await user.click(trigger);
    const matches = screen.getAllByText("Mistral Large");
    expect(matches.length).toBe(2); // trigger button + dropdown item
  });

  it("changes model when clicking a different option", async () => {
    const user = userEvent.setup();
    render(<TopBar onNewChat={() => {}} />);
    const trigger = screen.getByText("Mistral Large").closest("button")!;
    await user.click(trigger);
    const option = screen.getByText("GPT-4o Mini");
    await user.click(option);
    expect(useUIStore.getState().model).toBe("openai/gpt-4o-mini");
  });

  it("calls onNewChat when New thread is clicked", async () => {
    let called = false;
    const user = userEvent.setup();
    render(<TopBar onNewChat={() => { called = true }} />);
    await user.click(screen.getByTitle("New thread"));
    expect(called).toBe(true);
  });

  it("toggles settings when settings button clicked", async () => {
    const user = userEvent.setup();
    render(<TopBar onNewChat={() => {}} />);
    await user.click(screen.getByTitle("Settings"));
    expect(useUIStore.getState().settingsOpen).toBe(true);
  });
});
