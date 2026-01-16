/* eslint-disable @typescript-eslint/no-explicit-any */
import { Receiver } from "@upstash/qstash";
import type { QStashConfig, Logger, VerifyOptions, VerifyResult } from "./types";

/**
 * QStashReceiver - Wrapper around @upstash/qstash Receiver
 * Provides signature verification for incoming QStash webhooks
 */
export class QStashReceiver {
  private receiver: Receiver;
  private logger: Logger;

  constructor(config: QStashConfig, logger: Logger) {
    this.logger = logger;

    if (!config.currentSigningKey) {
      this.logger.warn({
        tag: "QStashReceiver",
        msg: "QSTASH_CURRENT_SIGNING_KEY not configured. Signature verification will fail.",
      });
    }

    this.receiver = new Receiver({
      currentSigningKey: config.currentSigningKey,
      nextSigningKey: config.nextSigningKey || "",
    });
  }

  /**
   * Verify incoming webhook signature
   */
  async verify(options: VerifyOptions): Promise<VerifyResult> {
    try {
      const isValid = await this.receiver.verify({
        signature: options.signature,
        body: options.body,
        url: options.url,
        clockTolerance: options.clockTolerance,
      });

      if (isValid) {
        this.logger.info({
          tag: "QStashReceiver",
          msg: "Signature verified successfully",
        });
      } else {
        this.logger.warn({
          tag: "QStashReceiver",
          msg: "Signature verification failed",
        });
      }

      return {
        valid: isValid,
      };
    } catch (error: any) {
      this.logger.error({
        tag: "QStashReceiver",
        msg: "Error during signature verification",
        error,
      });

      return {
        valid: false,
        error: error.message || "Verification failed",
      };
    }
  }

  /**
   * Verify from HTTP request headers and body
   * Useful for Next.js API routes
   */
  async verifyRequest(request: {
    headers: Record<string, string | string[] | undefined>;
    body: string;
    url?: string;
  }): Promise<VerifyResult> {
    try {
      // Extract signature from headers
      const signature =
        (request.headers["upstash-signature"] as string) || (request.headers["Upstash-Signature"] as string) || "";

      if (!signature) {
        this.logger.warn({
          tag: "QStashReceiver",
          msg: "No signature found in request headers",
        });

        return {
          valid: false,
          error: "Missing signature header",
        };
      }

      return await this.verify({
        signature,
        body: request.body,
        url: request.url,
      });
    } catch (error: any) {
      this.logger.error({
        tag: "QStashReceiver",
        msg: "Error during request verification",
        error,
      });

      return {
        valid: false,
        error: error.message || "Verification failed",
      };
    }
  }

  /**
   * Verify from Next.js Request object
   */
  async verifyNextRequest(request: Request): Promise<VerifyResult> {
    try {
      const signature = request.headers.get("upstash-signature") || request.headers.get("Upstash-Signature") || "";

      if (!signature) {
        this.logger.warn({
          tag: "QStashReceiver",
          msg: "No signature found in request headers",
        });

        return {
          valid: false,
          error: "Missing signature header",
        };
      }

      const body = await request.text();

      return await this.verify({
        signature,
        body,
        url: request.url,
      });
    } catch (error: any) {
      this.logger.error({
        tag: "QStashReceiver",
        msg: "Error during Next.js request verification",
        error,
      });

      return {
        valid: false,
        error: error.message || "Verification failed",
      };
    }
  }
}
