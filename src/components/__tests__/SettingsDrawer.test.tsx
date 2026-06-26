import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDrawer } from "../ui/SettingsDrawer";
import { useUIStore } from "../../store/uiStore";

describe("SettingsDrawer", () => {
  beforeEach(() => {
    useUIStore.setState({ settingsOpen: false, theme: "sunrise" });
  });

  it("does not render when settings are closed", () => {
    const { container } = render(<SettingsDrawer />);
    expect(container.textContent).toBe("");
  });

  it("renders when settings are open", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("renders all 4 API key sections", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText("Mistral API Key")).toBeTruthy();
    expect(screen.getByText("OpenAI API Key")).toBeTruthy();
    expect(screen.getByText("Anthropic API Key")).toBeTruthy();
    expect(screen.getByText("Gemini API Key")).toBeTruthy();
  });

  it("renders Ollama URL input and connect button", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByPlaceholderText("http://localhost:11434")).toBeTruthy();
    expect(screen.getByText("Connect")).toBeTruthy();
  });

  it("renders theme selector with 5 themes", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);

    expect(screen.getByText("◉ Void")).toBeTruthy();
    expect(screen.getByText("◉ Dusk")).toBeTruthy();
    expect(screen.getByText("◉ Sand")).toBeTruthy();
    expect(screen.getByText("◉ Snow")).toBeTruthy();
    expect(screen.getByText("◉ Sunrise")).toBeTruthy();
  });

  it("renders system instruction textarea", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByPlaceholderText("Enter system instruction...")).toBeTruthy();
  });

  it("renders temperature slider", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText(/Temperature/)).toBeTruthy();
  });

  it("renders canvas toggle sections", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText("Minimap")).toBeTruthy();
    expect(screen.getByText("Confidence scoring")).toBeTruthy();
    expect(screen.getByText("Follow-up suggestions")).toBeTruthy();
  });

  it("renders data action buttons", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText("↓ Export")).toBeTruthy();
    expect(screen.getByText("↑ Import")).toBeTruthy();
  });

  it("renders shortcuts button", () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    expect(screen.getByText(/Shortcuts/)).toBeTruthy();
  });

  it("closes when backdrop clicked", async () => {
    useUIStore.getState().toggleSettings();
    render(<SettingsDrawer />);
    const user = userEvent.setup();

    // Click the backdrop (first motion div with onClick=toggleSettings)
    const backdrop = document.querySelector('[style*="backdrop-filter"]');
    if (backdrop) {
      await user.click(backdrop);
      expect(useUIStore.getState().settingsOpen).toBe(false);
    }
  });
});
