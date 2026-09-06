const developmentSecrets = {
  admin: "development-admin-session-secret-change-me",
  customer: "development-session-secret-change-me",
};

export function isProductionSessionSecret(value: string | undefined): boolean {
  return Boolean(
    value && value.trim().length >= 32 && !/^(replace[-_ ]|development[-_ ])/i.test(value.trim()),
  );
}

export function getSessionSecret(
  audience: keyof typeof developmentSecrets,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.NODE_ENV && !["development", "production", "test"].includes(env.NODE_ENV)) {
    throw new Error("NODE_ENV must be development, production or test.");
  }
  const value = env.SESSION_SECRET;
  if (env.NODE_ENV === "production") {
    if (!isProductionSessionSecret(value)) {
      throw new Error(
        "SESSION_SECRET is required in production: use at least 32 random characters, not a placeholder.",
      );
    }
    return value!;
  }
  const secret = value || developmentSecrets[audience];
  if (secret.trim().length < 16)
    throw new Error("SESSION_SECRET must contain at least 16 characters.");
  return secret;
}
