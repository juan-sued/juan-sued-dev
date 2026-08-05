import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn() }));

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/components/admin-shell", () => ({ AdminShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

import OpportunitiesPage from "../app/admin/crm/opportunities/page";

describe("opportunity board", () => {
  it("groups visible opportunities by stage and preserves filters when switching views", async () => {
    mocks.requireAdmin.mockResolvedValue({ email: "admin@example.com" });
    const query = {
      select: () => query,
      eq: () => query,
      or: () => query,
      order: () => query,
      range: vi.fn().mockResolvedValue({ count: 2, data: [
        { id: "one", title: "Platform Engineer", company_name: "Acme", status: "screening", next_action_at: null },
        { id: "two", title: "Designer", company_name: null, status: "offer", next_action_at: null },
      ], error: null }),
    };
    mocks.createClient.mockResolvedValue({ from: () => query });

    render(await OpportunitiesPage({ searchParams: Promise.resolve({ view: "board", q: "engineer" }) }));

    expect(screen.getByLabelText("Quadro de oportunidades")).toHaveTextContent("screening1");
    expect(screen.getByRole("link", { name: /Platform EngineerAcme/ })).toHaveAttribute("href", "/admin/crm/opportunities/one");
    expect(screen.getByRole("link", { name: "Tabela" })).toHaveAttribute("href", "/admin/crm/opportunities?q=engineer");
  });
});
