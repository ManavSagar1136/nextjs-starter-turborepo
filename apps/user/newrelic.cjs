/**
 * New Relic Configuration
 *
 * This file is auto-loaded by the New Relic agent when the app starts.
 * Configure via environment variables (recommended) or edit values directly.
 *
 * @see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/
 */

/* eslint-disable no-undef */
"use strict";

exports.config = {
  /**
   * Application name in New Relic dashboard
   * Use NEW_RELIC_APP_NAME env var to override
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || "user-app"],

  /**
   * License key from New Relic account
   * Required for the agent to report data
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || "",

  /**
   * Agent logging configuration
   */
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || "info",
  },

  /**
   * Distributed tracing for connecting logs to traces
   */
  distributed_tracing: {
    enabled: true,
  },

  /**
   * Application logging - sends logs to New Relic
   */
  application_logging: {
    enabled: true,
    forwarding: {
      /**
       * Enable automatic log forwarding to New Relic
       * Pino logs will be automatically enriched with trace context
       */
      enabled: true,
      max_samples_stored: 10000,
    },
    metrics: {
      enabled: true,
    },
    local_decorating: {
      enabled: false,
    },
  },

  /**
   * Error collection settings
   */
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },

  /**
   * Transaction tracing
   */
  transaction_tracer: {
    enabled: true,
    record_sql: "obfuscated",
    explain_threshold: 500,
  },

  /**
   * Slow SQL tracking
   */
  slow_sql: {
    enabled: true,
    max_samples: 10,
  },

  /**
   * Allow all headers (useful for debugging)
   */
  allow_all_headers: true,

  /**
   * Attribute filtering - exclude sensitive data
   */
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "request.headers.proxyAuthorization",
      "request.headers.setCookie*",
      "request.headers.x*",
      "response.headers.cookie",
      "response.headers.authorization",
      "response.headers.proxyAuthorization",
      "response.headers.setCookie*",
      "response.headers.x*",
    ],
  },

  /**
   * Disable agent if NEW_RELIC_ENABLED is not "true"
   * This allows easy toggling via environment variables
   */
  agent_enabled: process.env.NEW_RELIC_ENABLED === "true",
};
