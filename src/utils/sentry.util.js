import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const captureError = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) return;

  let exception = error;
  let finalContext = context;

  if (typeof error === "string" && context.extraArgs && context.extraArgs[0] instanceof Error) {
    exception = context.extraArgs[0];
    finalContext = { ...context, message: error };
  }

  Sentry.captureException(exception, {
    extra: finalContext,
  });
};
