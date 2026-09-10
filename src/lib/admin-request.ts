import { verifyAdminSessionToken } from "@/lib/admin-session";
import {
  assertSameOrigin,
  RequestOriginError,
  OriginConfigurationError,
} from "@/lib/request-origin";

export class AdminAuthenticationError extends Error {
  readonly status = 401;
  constructor() {
    super("ورود ادمین لازم است.");
  }
}

export function adminRequestErrorStatus(error: unknown): number {
  if (
    error instanceof AdminAuthenticationError ||
    error instanceof RequestOriginError ||
    error instanceof OriginConfigurationError
  )
    return error.status;
  return 400;
}

export async function requireAdminRead(request: Request): Promise<void> {
  const cookies = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim());
  const sessions = cookies.filter((part) => part.startsWith("ufo_admin_session="));
  const token = sessions.length === 1 ? sessions[0]!.slice("ufo_admin_session=".length) : undefined;
  if (!(await verifyAdminSessionToken(token))) throw new AdminAuthenticationError();
}

export async function requireAdminMutation(request: Request): Promise<void> {
  await requireAdminRead(request);
  assertSameOrigin(request);
}
