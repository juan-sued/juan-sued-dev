import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn() }));

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/components/admin-shell", () => ({ AdminShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

import AdminPage from "../app/admin/page";

function client(results: unknown[]) {
  const query = {
    select: () => query,
    eq: () => query,
    in: () => query,
    not: () => query,
    gte: () => query,
    order: () => query,
    limit: () => query,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(results.shift()).then(resolve),
  };
  return { from: vi.fn(() => query) };
}

describe("admin dashboard", () => {
  it("shows dashboard counts, ordered upcoming work, and usable record links", async () => {
    mocks.requireAdmin.mockResolvedValue({ email: "admin@example.com" });
    mocks.createClient.mockResolvedValue(client([
      { count: 3 }, { count: 2 }, { count: 8 }, { count: 1 },
      { data: [{ id: "contact-1", name: "Ana", next_action_at: "2026-08-10T12:00:00Z" }] },
      { data: [{ id: "opportunity-1", title: "Platform Engineer", next_action_at: "2026-08-09T12:00:00Z" }] },
      { data: [{ id: "contact-1", name: "Ana", email: "ana@example.com", status: "new" }] },
      { data: [{ id: "opportunity-1", title: "Platform Engineer", company_name: "Acme", status: "screening" }] },
    ]));

    render(await AdminPage());

    expect(screen.getByRole("region", { name: "Resumo" })).toHaveTextContent("Novos contatos3");
    expect(screen.getByRole("link", { name: /Platform EngineerAcme/ })).toHaveAttribute("href", "/admin/crm/opportunities/opportunity-1");
    expect(screen.getByRole("link", { name: "Abrir quadro de oportunidades" })).toHaveAttribute("href", "/admin/crm/opportunities?view=board");
    const upcoming = screen.getByRole("heading", { name: "Próximas ações" }).parentElement?.parentElement?.parentElement;
    expect(upcoming).toHaveTextContent(/Platform Engineer.*Ana/s);
  });
});
