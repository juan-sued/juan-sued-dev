import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificationsGrid, CertificationsSection } from "../components/certifications/certifications-section";
import { featuredCertificationViews } from "../lib/repositories/certifications";

const sql = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "SQL: explorando consultas e manipulação de dados",
  issuer: "Alura",
  category: "Banco de Dados",
  completedAt: "2026-03-15",
  workloadHours: 14,
  featured: true,
  pdfUrl: "https://cdn.example/alura/2026/alura-sql.pdf",
};

const node = {
  id: "00000000-0000-4000-8000-000000000002",
  title: "Carreira Node.js: boas-vindas e primeiros passos",
  issuer: "Alura",
  category: "Back-end",
  completedAt: "2026-01-13",
  workloadHours: 2,
  featured: false,
  pdfUrl: "https://cdn.example/alura/2026/alura-node.pdf",
};

describe("certifications section (Home)", () => {
  it("renders the section with the localized title when featured certifications exist", () => {
    render(<CertificationsSection title="Certificações em destaque" eyebrow="Certificações" certifications={[sql]} locale="pt" />);
    expect(screen.getByRole("heading", { name: "Certificações em destaque" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "SQL: explorando consultas e manipulação de dados" })).toBeDefined();
  });

  it("shows only the SQL featured certification on Home (Node is not featured)", () => {
    const featured = featuredCertificationViews([sql, node]);
    expect(featured).toEqual([sql]);
  });

  it("does not render an empty section when there are no certifications", () => {
    const { container } = render(<CertificationsSection title="Certificações em destaque" certifications={[]} locale="pt" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders safe pdf links", () => {
    render(<CertificationsSection title="Certificações em destaque" certifications={[sql]} locale="pt" />);
    const link = screen.getByRole("link", { name: /abre em nova aba/ });
    expect(link.getAttribute("href")).toBe("https://cdn.example/alura/2026/alura-sql.pdf");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener noreferrer");
  });
});

describe("certifications grid (Sobre)", () => {
  it("renders all certifications in the given order", () => {
    render(<CertificationsGrid certifications={[sql, node]} locale="pt" />);
    const headings = screen.getAllByRole("heading").map(item => item.textContent);
    expect(headings).toEqual(["SQL: explorando consultas e manipulação de dados", "Carreira Node.js: boas-vindas e primeiros passos"]);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<CertificationsGrid certifications={[]} locale="pt" />);
    expect(container.firstChild).toBeNull();
  });

  it("localizes titles in English", () => {
    render(<CertificationsGrid certifications={[{ ...sql, title: "SQL: Exploring Queries and Data Manipulation" }]} locale="en" />);
    expect(screen.getByRole("heading", { name: "SQL: Exploring Queries and Data Manipulation" })).toBeDefined();
  });
});
