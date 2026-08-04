import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: ({ alt }: { alt: string }) => <span aria-label={alt} /> }));
import { ClientShell } from "../components/client-shell";
import { ContactForm, Lab } from "../components/client-widgets";

const shell = (locale: "pt" | "en" = "pt") => render(<ClientShell locale={locale} theme="light" recruiter={false}><p>Conteúdo</p></ClientShell>);
const openMenu = (locale: "pt" | "en" = "pt") => { shell(locale); const label = locale === "pt" ? "Menu de comandos" : "Command menu"; const trigger = screen.getByRole("button", { name: label }); fireEvent.click(trigger); return { trigger, label }; };

describe("portfolio controls", () => {
  it("localizes command menu and persists preference cookies", () => {
    Object.defineProperty(window, "location", { value: { reload: vi.fn() }, writable: true });
    shell("pt"); expect(screen.getByRole("button", { name: "Menu de comandos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modo Recrutador" })); expect(document.cookie).toContain("juan-recruiter=true");
    fireEvent.click(screen.getByRole("button", { name: "Idioma" })); expect(document.cookie).toContain("juan-locale=en");
  });
  it("renders English command menu", () => { shell("en"); expect(screen.getByRole("button", { name: "Command menu" })).toBeInTheDocument(); });
  it("opens and closes mobile navigation with accessible state", async () => {
    shell("pt"); const trigger = screen.getByRole("button", { name: "Abrir menu" }); expect(trigger).toHaveAttribute("aria-expanded", "false"); fireEvent.click(trigger); expect(trigger).toHaveAttribute("aria-expanded", "true"); expect(screen.getByRole("dialog", { name: "Navegação" })).toBeInTheDocument(); fireEvent.keyDown(document, { key: "Escape" }); await new Promise(resolve => requestAnimationFrame(resolve)); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
  });
  it("traps modal focus, inertizes background and restores trigger focus", async () => {
    const { trigger, label } = openMenu(); const dialog = screen.getByRole("dialog", { name: label }); expect(document.getElementById("site-header")).toHaveAttribute("inert"); expect(document.getElementById("site-content")).toHaveAttribute("inert");
    const focusable = dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'); focusable[focusable.length - 1].focus(); fireEvent.keyDown(document, { key: "Tab" }); expect(focusable[0]).toHaveFocus(); focusable[0].focus(); fireEvent.keyDown(document, { key: "Tab", shiftKey: true }); expect(focusable[focusable.length - 1]).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" }); await new Promise(resolve => requestAnimationFrame(resolve)); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus(); expect(document.getElementById("site-header")).not.toHaveAttribute("inert");
  });
  it("has named secure project links and both downloads", async () => {
    const { Projects } = await import("../components/server-content"); render(<Projects locale="pt"/>);
    expect(screen.getByRole("link", { name: "Conhecer projeto BikerWay" })).toHaveAttribute("rel", "noopener noreferrer"); expect(screen.getByRole("link", { name: "Conhecer projeto Event Horizon" })).toHaveAttribute("target", "_blank");
    const { label } = openMenu(); expect(screen.getByRole("link", { name: "Baixar currículo ATS" })).toHaveAttribute("download"); expect(screen.getByRole("link", { name: "Baixar currículo visual" })).toHaveAttribute("download"); expect(screen.getByRole("dialog", { name: label })).toBeInTheDocument();
  });
  it("does not generate mailto for invalid data and encodes valid data", () => {
    const assign = vi.fn(); Object.defineProperty(window, "location", { value: { assign }, writable: true }); render(<ContactForm locale="pt"/>);
    const submit = () => fireEvent.submit(screen.getByRole("button", { name: "Abrir no aplicativo de e-mail" }).closest("form")!);
    submit(); expect(assign).not.toHaveBeenCalled(); fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } }); fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalido" } }); fireEvent.change(screen.getByLabelText("Mensagem"), { target: { value: "mensagem válida" } }); submit(); expect(assign).not.toHaveBeenCalled(); fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@example.com" } }); fireEvent.change(screen.getByLabelText("Mensagem"), { target: { value: "curta" } }); submit(); expect(assign).not.toHaveBeenCalled(); fireEvent.change(screen.getByLabelText("Mensagem"), { target: { value: "Mensagem válida para contato" } }); submit(); expect(assign).toHaveBeenCalledWith(expect.stringContaining("Ana%0AE-mail%3A%20ana%40example.com%0A%0AMensagem%20v%C3%A1lida")); expect(screen.getByRole("status")).toHaveTextContent("Abrindo aplicativo");
  });
  it("updates offline queue state with pressed and textual feedback", () => {
    render(<Lab locale="pt"/>); const retry = screen.getByRole("button", { name: /Tentando novamente/i }); fireEvent.click(retry); expect(retry).toHaveAttribute("aria-pressed", "true"); expect(screen.getByText(/Falha temporária/)).toBeInTheDocument();
  });
  it("renders premium Hero CTAs", async () => {
    const { Home } = await import("../components/server-content"); render(<Home locale="pt"/>); expect(screen.getByRole("link", { name: "Ver experiência" })).toHaveAttribute("href", "/experiencia"); expect(screen.getByRole("link", { name: "Baixar currículo" })).toHaveAttribute("href", "/curriculo"); expect(screen.getByRole("link", { name: "Entrar em contato" })).toHaveAttribute("href", "/contato");
  });
  it("uses professional summary without a second time promise", async () => {
    const { Home } = await import("../components/server-content"); render(<Home locale="pt"/>); expect(screen.getByRole("heading", { name: "Resumo profissional" })).toBeInTheDocument(); expect(screen.queryByText("Resumo em 30 segundos")).not.toBeInTheDocument();
  });
});
