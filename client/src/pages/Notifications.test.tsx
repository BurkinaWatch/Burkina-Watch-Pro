import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import Notifications from "./Notifications";

vi.mock("@/components/Header", () => ({
  default: () => React.createElement("header", { "data-testid": "mock-header" }),
}));

vi.mock("@/components/BottomNav", () => ({
  default: () => React.createElement("nav", { "data-testid": "mock-bottom-nav" }),
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href }, children),
}));

type NotificationRecord = {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  signalementId?: string | null;
};

const notification: NotificationRecord = {
  id: "notification-1",
  userId: "user-1",
  type: "urgence",
  title: "Alerte sécurité",
  description: "Une nouvelle alerte a été publiée.",
  read: true,
  createdAt: "2026-09-02T12:00:00.000Z",
  signalementId: null,
};

const unreadNotification = { ...notification, read: false };

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 500 ? "Internal Server Error" : "OK",
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

function renderNotifications() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Notifications),
    ),
  );
}

function requestsFor(url: string, method = "GET") {
  return vi
    .mocked(fetch)
    .mock.calls.filter(
      ([requestUrl, options]) =>
        requestUrl === url &&
        ((options as RequestInit | undefined)?.method ?? "GET") === method,
    );
}

describe("Notifications", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal(
      "Audio",
      class MockAudio {
        volume = 0;
        play = vi.fn().mockResolvedValue(undefined);
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a loading state and renders notification records from the API", async () => {
    let resolveResponse!: (response: unknown) => void;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    vi.mocked(fetch).mockReturnValue(responsePromise as Promise<Response>);

    renderNotifications();

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    resolveResponse(jsonResponse([notification]));

    expect(await screen.findByText(notification.title)).toBeInTheDocument();
    expect(
      screen.getByText(notification.description),
    ).toBeInTheDocument();
    expect(requestsFor("/api/notifications")).toHaveLength(1);
  });

  it("shows a clear error when the notifications API returns a malformed response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ notifications: [] }));

    renderNotifications();

    expect(
      await screen.findByText(
        "Impossible de charger les notifications. Veuillez réessayer.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(notification.title)).not.toBeInTheDocument();
  });

  it("shows a clear error when the notifications API request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: "failure" }, 500));

    renderNotifications();

    expect(
      await screen.findByText(
        "Impossible de charger les notifications. Veuillez réessayer.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the empty state for an empty notification list", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));

    renderNotifications();

    expect(
      await screen.findByText("Aucune notification pour le moment"),
    ).toBeInTheDocument();
  });

  it("marks one notification as read with the notification-specific endpoint", async () => {
    vi.mocked(fetch).mockImplementation(async (input, options) => {
      const url = String(input);
      const method = options?.method ?? "GET";

      if (url === "/api/notifications" && method === "GET") {
        return jsonResponse([unreadNotification]) as Response;
      }
      if (url === "/api/notifications/mark-all-read") {
        return jsonResponse({ message: "ok" }) as Response;
      }
      if (url === `/api/notifications/${notification.id}/read`) {
        return jsonResponse({ ...unreadNotification, read: true }) as Response;
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    renderNotifications();
    const card = await screen.findByTestId(
      `notification-${notification.id}`,
    );

    await userEvent.click(within(card).getByText(notification.title));

    await waitFor(() => {
      expect(
        requestsFor(
          `/api/notifications/${notification.id}/read`,
          "PATCH",
        ),
      ).toHaveLength(1);
    });
    expect(
      requestsFor(
        `/api/notifications/${notification.id}/read`,
        "PATCH",
      )[0][1],
    ).toMatchObject({ method: "PATCH", credentials: "include" });
  });

  it("marks all notifications as read when the user selects the action", async () => {
    vi.mocked(fetch).mockImplementation(async (input, options) => {
      const url = String(input);
      const method = options?.method ?? "GET";

      if (url === "/api/notifications" && method === "GET") {
        return jsonResponse([unreadNotification]) as Response;
      }
      if (url === "/api/notifications/mark-all-read") {
        return jsonResponse({ message: "ok" }) as Response;
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    renderNotifications();
    const markAllButton = await screen.findByRole("button", {
      name: "Tout marquer comme lu",
    });

    await waitFor(() => {
      expect(
        requestsFor("/api/notifications/mark-all-read", "POST"),
      ).toHaveLength(1);
    });
    await userEvent.click(markAllButton);

    await waitFor(() => {
      expect(
        requestsFor("/api/notifications/mark-all-read", "POST"),
      ).toHaveLength(2);
    });
    expect(
      requestsFor("/api/notifications/mark-all-read", "POST")[1][1],
    ).toMatchObject({ method: "POST", credentials: "include" });
  });

  it("deletes one notification after confirmation", async () => {
    vi.mocked(fetch).mockImplementation(async (input, options) => {
      const url = String(input);
      const method = options?.method ?? "GET";

      if (url === "/api/notifications" && method === "GET") {
        return jsonResponse([notification]) as Response;
      }
      if (url === `/api/notifications/${notification.id}`) {
        return jsonResponse({ message: "deleted" }) as Response;
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    renderNotifications();
    const card = await screen.findByTestId(
      `notification-${notification.id}`,
    );
    await userEvent.click(
      within(card).getByRole("button", {
        name: "Supprimer la notification",
      }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Supprimer" }),
    );

    await waitFor(() => {
      expect(
        requestsFor(`/api/notifications/${notification.id}`, "DELETE"),
      ).toHaveLength(1);
    });
    expect(
      requestsFor(`/api/notifications/${notification.id}`, "DELETE")[0][1],
    ).toMatchObject({ method: "DELETE", credentials: "include" });
  });

  it("deletes all notifications after confirmation", async () => {
    vi.mocked(fetch).mockImplementation(async (input, options) => {
      const url = String(input);
      const method = options?.method ?? "GET";

      if (url === "/api/notifications" && method === "GET") {
        return jsonResponse([notification]) as Response;
      }
      if (url === "/api/notifications" && method === "DELETE") {
        return jsonResponse({ message: "deleted" }) as Response;
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    renderNotifications();
    await screen.findByTestId(`notification-${notification.id}`);
    await userEvent.click(
      screen.getByRole("button", { name: /Tout supprimer/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Supprimer tout" }),
    );

    await waitFor(() => {
      expect(requestsFor("/api/notifications", "DELETE")).toHaveLength(1);
    });
    expect(requestsFor("/api/notifications", "DELETE")[0][1]).toMatchObject({
      method: "DELETE",
      credentials: "include",
    });
  });
});