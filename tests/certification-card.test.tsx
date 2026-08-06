import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificationCard } from "../components/certifications/certification-card";

const view = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "SQL: explorando consultas e manipulação de dados",
  issuer: "Alura",
  category: "Banco de Dados",
  completedAt: "2026-03-15",
  workloadHours: 14,
  featured: true,
  pdfUrl: "https://cdn.example/alura/2026/alura-sql.pdf",
};

describe("certification card", () => {
  it("renders localized PT content", () => {
    render(<CertificationCard cert={view} locale="pt" />);
    expect(screen.getByRole("heading", { name: "SQL: explorando consultas e manipulação de dados" })).toBeDefined();
    expect(screen.getByText("Alura")).toBeDefined();
    expect(screen.getByText("Banco de Dados")).toBeDefined();
    expect(screen.getByText(/março de 2026/)).toBeDefined();
    expect(screen.getByText("14 horas")).toBeDefined();
  });

  it("renders localized EN content", () => {
    render(<CertificationCard cert={{ ...view, title: "SQL: Exploring Queries and Data Manipulation", category: "Database" }} locale="en" />);
    expect(screen.getByRole("heading", { name: "SQL: Exploring Queries and Data Manipulation" })).toBeDefined();
    expect(screen.getByText("Database")).toBeDefined();
    expect(screen.getByText(/March 2026/)).toBeDefined();
    expect(screen.getByText("14 hours")).toBeDefined();
    expect(screen.getByRole("link", { name: /View certificate/ })).toBeDefined();
  });

  it("pluralizes one hour correctly", () => {
    render(<CertificationCard cert={{ ...view, workloadHours: 1 }} locale="pt" />);
    expect(screen.getByText("1 hora")).toBeDefined();
  });

  it("renders a safe external link that opens in a new tab", () => {
    render(<CertificationCard cert={view} locale="pt" />);
    const link = screen.getByRole("link", { name: /Ver certificado SQL: explorando consultas e manipulação de dados — abre em nova aba/ });
    expect(link.getAttribute("href")).toBe("https://cdn.example/alura/2026/alura-sql.pdf");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("shows the featured badge only when featured", () => {
    const { rerender } = render(<CertificationCard cert={view} locale="pt" />);
    expect(screen.getByText("Em destaque")).toBeDefined();
    rerender(<CertificationCard cert={{ ...view, featured: false }} locale="pt" />);
    expect(screen.queryByText("Em destaque")).toBeNull();
  });

  it("never exposes internal storage fields", () => {
    render(<CertificationCard cert={view} locale="pt" />);
    expect(screen.queryByText(/storage_path|publication_status|archived_at|updated_by|recruiter_visible/)).toBeNull();
  });
});
