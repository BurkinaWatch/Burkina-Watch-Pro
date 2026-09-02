import type { Express, RequestHandler } from "express";
import type { IStorage } from "./storage";

export function registerNotificationRoutes(
  app: Pick<Express, "get" | "patch" | "post" | "delete">,
  notificationStorage: Pick<
    IStorage,
    | "getUserNotifications"
    | "getUnreadNotificationsCount"
    | "getNotificationById"
    | "markNotificationAsRead"
    | "markAllNotificationsAsRead"
    | "deleteNotification"
    | "deleteAllUserNotifications"
  >,
  isAuthenticated: RequestHandler,
) {
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await notificationStorage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await notificationStorage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du nombre de notifications non lues" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      const existing = await notificationStorage.getNotificationById(notificationId);

      if (!existing) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const notification = await notificationStorage.markNotificationAsRead(
        notificationId,
        userId,
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await notificationStorage.markAllNotificationsAsRead(userId);
      res.json({ message: "Toutes les notifications ont été marquées comme lues" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour des notifications" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      const notification = await notificationStorage.getNotificationById(notificationId);

      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const success = await notificationStorage.deleteNotification(
        notificationId,
        userId,
      );

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de la suppression" });
      }

      res.json({ message: "Notification supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la notification" });
    }
  });

  app.delete("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await notificationStorage.deleteAllUserNotifications(userId);
      res.json({ message: "Toutes les notifications ont été supprimées" });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ error: "Erreur lors de la suppression des notifications" });
    }
  });
}