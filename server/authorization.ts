import type { Request, RequestHandler } from "express";

type Claims = {
  sub?: unknown;
};

type RequestUser = {
  id?: unknown;
  role?: unknown;
  claims?: Claims;
  [key: string]: unknown;
};

type AuthenticatedRequest = Request & {
  user?: RequestUser;
  isAuthenticated?: () => boolean;
};

export interface AuthenticatedPrincipal extends RequestUser {
  id: string;
  role?: string;
}

export function getAuthenticatedPrincipal(
  req: Request,
): AuthenticatedPrincipal | undefined {
  const authenticatedRequest = req as AuthenticatedRequest;
  const candidate = authenticatedRequest.user;
  const isAuthenticated =
    typeof authenticatedRequest.isAuthenticated === "function"
      ? authenticatedRequest.isAuthenticated()
      : Boolean(candidate);

  if (!isAuthenticated || !candidate || typeof candidate !== "object") {
    return undefined;
  }

  const claimId =
    typeof candidate.claims?.sub === "string" ? candidate.claims.sub : undefined;
  const directId = typeof candidate.id === "string" ? candidate.id : undefined;
  const id = claimId || directId;

  if (!id) {
    return undefined;
  }

  return {
    ...candidate,
    id,
    role: typeof candidate.role === "string" ? candidate.role : undefined,
  };
}

export function getAuthenticatedUserId(req: Request): string | undefined {
  return getAuthenticatedPrincipal(req)?.id;
}

export const requireAuthenticatedUser: RequestHandler = (req, res, next) => {
  if (getAuthenticatedPrincipal(req)) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const principal = getAuthenticatedPrincipal(req);
    if (!principal) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!principal.role || !roles.includes(principal.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}

export type ResourceOwnership = {
  userId?: string | null;
  ownerId?: string | null;
  ownerUserId?: string | null;
};

export type ResourceResolver = (
  req: Request,
  userId: string,
) => ResourceOwnership | undefined | Promise<ResourceOwnership | undefined>;

export function requireResourceOwnership(
  resolveResource: ResourceResolver,
  options: { allowRoles?: readonly string[] } = {},
): RequestHandler {
  return async (req, res, next) => {
    const principal = getAuthenticatedPrincipal(req);
    if (!principal) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const resource = await resolveResource(req, principal.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const ownerId =
      resource.ownerUserId ?? resource.ownerId ?? resource.userId ?? undefined;
    const roleAllowed = principal.role
      ? options.allowRoles?.includes(principal.role) === true
      : false;

    if (ownerId !== principal.id && !roleAllowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}

export type PermissionChecker = (
  principal: AuthenticatedPrincipal,
  permission: string,
  req: Request,
) => boolean | Promise<boolean>;

export function requirePermission(
  permission: string,
  checkPermission: PermissionChecker,
): RequestHandler {
  return async (req, res, next) => {
    const principal = getAuthenticatedPrincipal(req);
    if (!principal) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!(await checkPermission(principal, permission, req))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}