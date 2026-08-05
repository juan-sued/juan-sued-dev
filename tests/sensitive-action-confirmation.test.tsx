import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { SensitiveActionConfirmation } from "../components/admin/sensitive-action-confirmation";

describe("sensitive action confirmation", () => {
  it("requires confirmation, submits id, then refreshes after success", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, data: { id: "record-1" }, message: "Archived." });
    render(<SensitiveActionConfirmation id="record-1" label="Archive" title="Archive record?" description="Removes record from active list." action={action} />);

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("dialog", { name: "Archive record?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
    const dialog = screen.getByRole("dialog", { name: "Archive record?" });
    fireEvent.submit(dialog.querySelector("form")!);

    await waitFor(() => expect(action).toHaveBeenCalled());
    expect(action.mock.calls[0][0].get("id")).toBe("record-1");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.success).toHaveBeenCalledWith("Archived.");
  });

  it("esc closes dialog and restores trigger focus without calling action", async () => {
    const action = vi.fn();
    render(<SensitiveActionConfirmation id="record-1" label="Archive" title="Archive record?" description="Removes record from active list." action={action} />);
    const trigger = screen.getByRole("button", { name: "Archive" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    await new Promise(resolve => requestAnimationFrame(resolve));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });
});
