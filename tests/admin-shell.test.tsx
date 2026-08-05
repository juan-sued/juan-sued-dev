import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
let pathname = "/admin/crm/opportunities/new";
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push }) }));
vi.mock("@/app/admin/actions", () => ({ logout: vi.fn() }));
import { AdminShell, isAdminNavActive } from "../components/admin-shell";

describe("admin shell", () => {
  it("matches exact dashboard route and nested section routes", () => {
    expect(isAdminNavActive("/admin/crm/contacts/123", "/admin/crm/contacts")).toBe(true);
    expect(isAdminNavActive("/admin/settings", "/admin")).toBe(false);
  });

  it("opens mobile sheet with focus trap, scroll lock, escape restore", async () => {
    render(<AdminShell email="admin@example.com"><p>Conteúdo</p></AdminShell>);
    const trigger = screen.getByRole("button", { name: "Abrir navegação" });
    fireEvent.click(trigger);
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog", { name: "Navegação" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });

  it("persists theme and runs keyboard command", () => {
    render(<AdminShell email="admin@example.com"><p>Conteúdo</p></AdminShell>);
    fireEvent.click(screen.getByRole("button", { name: "Usar tema escuro" }));
    expect(localStorage.getItem("juan-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const search = screen.getByRole("textbox", { name: "Buscar comandos" });
    fireEvent.change(search, { target: { value: "oport" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/admin/crm/opportunities");
  });
});
