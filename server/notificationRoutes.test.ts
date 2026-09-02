import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerNotificationRoutes } from "./notificationRoutes";

type Notification = {
  id: string;
  userId: string;
  read: boolean;
};

type RouteHandler = (req: any, res: any) => Promise<unknown> | unknown;

function createRouteApp() {
  const routes = new Map<string, RouteHandler>();
  const app = {
    get: vi.fn((path: string, ...handlers: RouteHandler[]) => {
      routes.set(`GET ${path}`, handlers.at(-1)!);
    }),
    patch: vi.fn((path: string, ...handlers: RouteHandler[]) => {
      routes.set(`PATCH ${path}`, handlers.at(-1)!);
    }),
    post: vi.fn((path: string, ...handlers: RouteHandler[]) => {
      routes.set(`POST ${path}`, handlers.at(-1)!);
    }),
    delete: vi.fn((path: string, ...handlers: RouteHandler[]) => {
      routes.set(`DELETE ${path}`, handlers.at(-1)!);
    }),
  };

  return {
    app,
    handler(method: string, path: string) {
      const route = routes.get(`${method} ${path}`);
      if (!route) throw new Error(`Route not registered: ${method} ${path}`);
      return route;
    },
  };
}

function createResponse() {
  const response: any = {
    status: vi.fn(() => response),
    json: vi.fn(() => response),
  };
  return response;
}

function createRequest(userId = "user-1", id = "notification-1") {
  return {
    user: { claims: { sub: userId } },
    params: { id },
  };
}

const ownNotification: Notification = {
  id: "notification-1",
  userId: "user-1",
  read: false,
};

const otherUsersNotification: Notification = {
  id: "notification-2",
  userId: "user-2",
  read: false,
};

describe("notification routes", () => {
  let routeApp: ReturnType<typeof createRouteApp>;
  let notificationStorage: {
    getUserNotifications: ReturnType<typeof vi.fn>;
    getUnreadNotificationsCount: ReturnType<typeof vi.fn>;
    getNotificationById: ReturnType<typeof vi.fn>;
    markNotificationAsRead: ReturnType<typeof vi.fn>;
    markAllNotificationsAsRead: ReturnType<typeof vi.fn>;
    deleteNotification: ReturnType<typeof vi.fn>;
    deleteAllUserNotifications: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    routeApp = createRouteApp();
    notificationStorage = {
      getUserNotifications: vi.fn(),
      getUnreadNotificationsCount: vi.fn(),
      getNotificationById: vi.fn(),
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      deleteAllUserNotifications: vi.fn(),
    };
    registerNotificationRoutes(routeApp.app, notificationStorage, (_req, _res, next) => next());
  });

  it("returns the unread count for the authenticated user", async () => {
    notificationStorage.getUnreadNotificationsCount.mockResolvedValue(3);
    const response = createResponse();

    await routeApp.handler("GET", "/api/notifications/unread-count")(
      createRequest("user-1"),
      response,
    );

    expect(notificationStorage.getUnreadNotificationsCount).toHaveBeenCalledWith("user-1");
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ count: 3 });
  });

  it("returns a server error when the unread count cannot be read", async () => {
    notificationStorage.getUnreadNotificationsCount.mockRejectedValue(new Error("storage down"));
    const response = createResponse();

    await routeApp.handler("GET", "/api/notifications/unread-count")(
      createRequest("user-1"),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération du nombre de notifications non lues",
    });
  });

  it("marks only the authenticated user's notification as read", async () => {
    notificationStorage.getNotificationById.mockResolvedValue(ownNotification);
    notificationStorage.markNotificationAsRead.mockResolvedValue({
      ...ownNotification,
      read: true,
    });
    const response = createResponse();

    await routeApp.handler("PATCH", "/api/notifications/:id/read")(
      createRequest("user-1"),
      response,
    );

    expect(notificationStorage.markNotificationAsRead).toHaveBeenCalledWith(
      ownNotification.id,
      "user-1",
    );
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      ...ownNotification,
      read: true,
    });
  });

  it("rejects marking another user's notification as read", async () => {
    notificationStorage.getNotificationById.mockResolvedValue(otherUsersNotification);
    const response = createResponse();

    await routeApp.handler("PATCH", "/api/notifications/:id/read")(
      createRequest("user-1", otherUsersNotification.id),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "Accès non autorisé" });
    expect(notificationStorage.markNotificationAsRead).not.toHaveBeenCalled();
  });

  it("returns not found and server errors for marking notifications as read", async () => {
    const responseForMissing = createResponse();
    notificationStorage.getNotificationById.mockResolvedValue(undefined);

    await routeApp.handler("PATCH", "/api/notifications/:id/read")(
      createRequest(),
      responseForMissing,
    );

    expect(responseForMissing.status).toHaveBeenCalledWith(404);
    expect(notificationStorage.markNotificationAsRead).not.toHaveBeenCalled();

    const responseForFailure = createResponse();
    notificationStorage.getNotificationById.mockRejectedValue(new Error("storage down"));

    await routeApp.handler("PATCH", "/api/notifications/:id/read")(
      createRequest(),
      responseForFailure,
    );

    expect(responseForFailure.status).toHaveBeenCalledWith(500);
    expect(responseForFailure.json).toHaveBeenCalledWith({
      error: "Erreur lors de la mise à jour de la notification",
    });
  });

  it("deletes only the authenticated user's notification", async () => {
    notificationStorage.getNotificationById.mockResolvedValue(ownNotification);
    notificationStorage.deleteNotification.mockResolvedValue(true);
    const response = createResponse();

    await routeApp.handler("DELETE", "/api/notifications/:id")(
      createRequest("user-1"),
      response,
    );

    expect(notificationStorage.deleteNotification).toHaveBeenCalledWith(
      ownNotification.id,
      "user-1",
    );
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({
      message: "Notification supprimée avec succès",
    });
  });

  it("rejects deleting another user's notification", async () => {
    notificationStorage.getNotificationById.mockResolvedValue(otherUsersNotification);
    const response = createResponse();

    await routeApp.handler("DELETE", "/api/notifications/:id")(
      createRequest("user-1", otherUsersNotification.id),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "Non autorisé" });
    expect(notificationStorage.deleteNotification).not.toHaveBeenCalled();
  });

  it("returns not found and storage errors for deleting notifications", async () => {
    const responseForMissing = createResponse();
    notificationStorage.getNotificationById.mockResolvedValue(undefined);

    await routeApp.handler("DELETE", "/api/notifications/:id")(
      createRequest(),
      responseForMissing,
    );

    expect(responseForMissing.status).toHaveBeenCalledWith(404);
    expect(notificationStorage.deleteNotification).not.toHaveBeenCalled();

    const responseForFailure = createResponse();
    notificationStorage.getNotificationById.mockResolvedValue(ownNotification);
    notificationStorage.deleteNotification.mockRejectedValue(new Error("storage down"));

    await routeApp.handler("DELETE", "/api/notifications/:id")(
      createRequest(),
      responseForFailure,
    );

    expect(responseForFailure.status).toHaveBeenCalledWith(500);
    expect(responseForFailure.json).toHaveBeenCalledWith({
      error: "Erreur lors de la suppression de la notification",
    });
  });

  it("returns a server error when a delete reports failure", async () => {
    notificationStorage.getNotificationById.mockResolvedValue(ownNotification);
    notificationStorage.deleteNotification.mockResolvedValue(false);
    const response = createResponse();

    await routeApp.handler("DELETE", "/api/notifications/:id")(
      createRequest(),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Erreur lors de la suppression",
    });
  });

  it("passes only the authenticated user's id to bulk actions", async () => {
    const markResponse = createResponse();
    const deleteResponse = createResponse();

    await routeApp.handler("POST", "/api/notifications/mark-all-read")(
      createRequest("user-1"),
      markResponse,
    );
    await routeApp.handler("DELETE", "/api/notifications")(
      createRequest("user-1"),
      deleteResponse,
    );

    expect(notificationStorage.markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
    expect(notificationStorage.deleteAllUserNotifications).toHaveBeenCalledWith("user-1");
    expect(notificationStorage.markAllNotificationsAsRead).not.toHaveBeenCalledWith("user-2");
    expect(notificationStorage.deleteAllUserNotifications).not.toHaveBeenCalledWith("user-2");
    expect(markResponse.status).not.toHaveBeenCalled();
    expect(deleteResponse.status).not.toHaveBeenCalled();
  });

  it("returns storage errors for bulk actions", async () => {
    notificationStorage.markAllNotificationsAsRead.mockRejectedValue(new Error("storage down"));
    notificationStorage.deleteAllUserNotifications.mockRejectedValue(new Error("storage down"));
    const markResponse = createResponse();
    const deleteResponse = createResponse();

    await routeApp.handler("POST", "/api/notifications/mark-all-read")(
      createRequest("user-1"),
      markResponse,
    );
    await routeApp.handler("DELETE", "/api/notifications")(
      createRequest("user-1"),
      deleteResponse,
    );

    expect(markResponse.status).toHaveBeenCalledWith(500);
    expect(deleteResponse.status).toHaveBeenCalledWith(500);
  });
});