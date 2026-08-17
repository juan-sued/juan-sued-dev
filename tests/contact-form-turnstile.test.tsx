import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "../components/client-widgets";

type TurnstileOptions = { callback: (token: string) => void; "error-callback": () => void; "expired-callback": () => void };

let options: TurnstileOptions | undefined;
const renderTurnstile = vi.fn((_container: HTMLElement, nextOptions: TurnstileOptions) => {
  options = nextOptions;
  return "widget-id";
});
const resetTurnstile = vi.fn();

const fillForm = () => {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "I would like to discuss a project." } });
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete window.turnstile;
  document.querySelector('script[data-turnstile="true"]')?.remove();
  options = undefined;
});

describe("ContactForm Turnstile", () => {
  it("submits memory-only Turnstile token", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    window.turnstile = { render: renderTurnstile, reset: resetTurnstile };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    render(<ContactForm locale="en" />);
    expect(renderTurnstile).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({ sitekey: "site-key" }));
    act(() => options?.callback("token-value"));
    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ turnstileToken: "token-value", honeypot: "" });
    expect(resetTurnstile).toHaveBeenCalledWith("widget-id");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Message sent. Thank you for reaching out!"));
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("blocks expired or failed challenge and resets widget", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    window.turnstile = { render: renderTurnstile, reset: resetTurnstile };
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<ContactForm locale="en" />);
    act(() => options?.callback("token-value"));
    act(() => options?.["expired-callback"]());
    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);

    expect(screen.getByRole("status")).toHaveTextContent("Complete verification before sending.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resetTurnstile).toHaveBeenCalledWith("widget-id");
    act(() => options?.["error-callback"]());
    expect(screen.getByRole("status")).toHaveTextContent("Verification unavailable. Try again.");
  });

  it("blocks valid production form when public key is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<ContactForm locale="en" />);
    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form")!);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Verification unavailable. Try again.");
  });
});
