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

  it("filters commands, exposes no-match state, and restores trigger focus on close", async () => {
    render(<AdminShell email="admin@example.com"><p>Conteúdo</p></AdminShell>);
    const trigger = screen.getByRole("button", { name: "Abrir comandos" });
    fireEvent.click(trigger);
    const search = screen.getByRole("textbox", { name: "Buscar comandos" });
    fireEvent.change(search, { target: { value: "missing" } });
    expect(screen.getByText("Nenhum comando encontrado.")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(trigger).toHaveFocus();
  });

  it("runs command actions", () => {
    render(<AdminShell email="admin@example.com"><p>Conteúdo</p></AdminShell>);
    fireEvent.click(screen.getByRole("button", { name: "Abrir comandos" }));

    fireEvent.click(screen.getByRole("option", { name: /Nova oportunidade/ }));
    expect(push).toHaveBeenCalledWith("/admin/crm/opportunities/new");

    fireEvent.click(screen.getByRole("button", { name: "Abrir comandos" }));
    const theme = document.documentElement.dataset.theme;
    fireEvent.click(screen.getByRole("option", { name: "Alternar tema" }));
    expect(document.documentElement.dataset.theme).toBe(theme === "dark" ? "light" : "dark");

    fireEvent.click(screen.getByRole("button", { name: "Abrir comandos" }));
    fireEvent.submit(screen.getByRole("option", { name: "Sair" }).closest("form")!);
    expect(screen.queryByRole("dialog", { name: "Comandos" })).not.toBeInTheDocument();
  });

  it("opens portfolio command with noopener and noreferrer", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<AdminShell email="admin@example.com"><p>Conteúdo</p></AdminShell>);
    fireEvent.click(screen.getByRole("button", { name: "Abrir comandos" }));
    fireEvent.click(screen.getByRole("option", { name: /Abrir portfólio/ }));
    expect(open).toHaveBeenCalledWith("/", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});
