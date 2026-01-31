/* eslint-disable no-undef */
"use strict";

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || "public-app"],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || "",
  logging: { level: process.env.NEW_RELIC_LOG_LEVEL || "info" },
  distributed_tracing: { enabled: true },
  application_logging: {
    enabled: true,
    forwarding: { enabled: true, max_samples_stored: 10000 },
    metrics: { enabled: true },
    local_decorating: { enabled: false },
  },
  error_collector: { enabled: true, ignore_status_codes: [404] },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "response.headers.cookie",
    ],
  },
  agent_enabled: process.env.NEW_RELIC_ENABLED === "true",
};
