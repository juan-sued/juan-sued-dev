import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createDraft: vi.fn(), update: vi.fn(), push: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("../app/admin/content/certifications/actions", () => ({ createCertificationDraft: mocks.createDraft, updateCertification: mocks.update }));

import { CertificationForm } from "../components/admin/certification-form";

const id = "11111111-1111-4111-8111-111111111111";

function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Título \(PT\)/), { target: { value: "SQL" } });
  fireEvent.change(screen.getByLabelText(/Título \(EN\)/), { target: { value: "SQL" } });
  fireEvent.change(screen.getByLabelText(/Emissor/), { target: { value: "Alura" } });
  fireEvent.change(screen.getByLabelText(/Data de conclusão/), { target: { value: "2026-03-15" } });
  fireEvent.change(screen.getByLabelText(/Arquivo PDF/), { target: { value: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf" } });
}

function submit() {
  fireEvent.submit(screen.getByTestId("certification-form"));
}

describe("certification form", () => {
  it("renders create mode and calls createCertificationDraft with field values", async () => {
    mocks.createDraft.mockResolvedValue({ ok: true, data: { id, path: `/admin/content/certifications/${id}` }, message: "Criada." });
    render(<CertificationForm existingFiles={["alura/2026/alura-sql-consultas-manipulacao-dados.pdf"]} />);

    fillRequired();
    submit();

    await waitFor(() => expect(mocks.createDraft).toHaveBeenCalled());
    const sent = mocks.createDraft.mock.calls[0][0] as FormData;
    expect(sent.get("title_pt")).toBe("SQL");
    expect(sent.get("issuer")).toBe("Alura");
    expect(sent.get("completed_at")).toBe("2026-03-15");
    expect(sent.get("storage_path")).toBe("alura/2026/alura-sql-consultas-manipulacao-dados.pdf");
    expect(sent.get("featured")).toBeNull();

    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Criada."));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`/admin/content/certifications/${id}`));
  });

  it("renders edit mode and calls updateCertification with the record id", async () => {
    mocks.update.mockResolvedValue({ ok: true, data: { id, path: `/admin/content/certifications/${id}` }, message: "Salva." });
    render(<CertificationForm certification={{ id, title_pt: "Node", title_en: "Node", issuer: "Alura", category: "backend", completed_at: "2026-01-13", workload_hours: 2, storage_path: "alura/2026/alura-nodejs-primeiros-passos.pdf", credential_url: null, skills: [], featured: true, recruiter_visible: true, display_order: 1, publication_status: "published" }} existingFiles={[]} />);

    submit();

    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    const sent = mocks.update.mock.calls[0][0] as FormData;
    expect(sent.get("id")).toBe(id);
    expect(sent.get("title_pt")).toBe("Node");
    expect(sent.get("storage_path")).toBe("alura/2026/alura-nodejs-primeiros-passos.pdf");
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Salva."));
  });

  it("shows field errors and focuses the first invalid field", async () => {
    mocks.createDraft.mockResolvedValue({ ok: false, message: "Dados inválidos.", fieldErrors: { title_pt: ["Obrigatório."] } });
    render(<CertificationForm existingFiles={[]} />);

    fillRequired();
    submit();

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório."));
    expect(mocks.error).toHaveBeenCalledWith("Dados inválidos.");
    await waitFor(() => expect(screen.getByLabelText(/Título \(PT\)/)).toHaveFocus());
  });
});
