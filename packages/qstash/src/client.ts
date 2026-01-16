/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@upstash/qstash";
import type {
  QStashConfig,
  Logger,
  PublishOptions,
  PublishResult,
  ScheduleOptions,
  ScheduleResult,
  QueueOptions,
  TopicPublishOptions,
} from "./types";

/**
 * QStashClient - Wrapper around @upstash/qstash Client
 * Provides type-safe methods for publishing messages, scheduling, and queue management
 */
export class QStashClient {
  private client: Client;
  private logger: Logger;

  constructor(config: QStashConfig, logger: Logger) {
    this.logger = logger;

    if (!config.token) {
      this.logger.warn({
        tag: "QStashClient",
        msg: "QStASH_TOKEN not configured. QStash operations will fail.",
      });
    }

    this.client = new Client({
      token: config.token,
      baseUrl: config.url,
    });
  }

  /**
   * Publish a JSON message immediately
   */
  async publishJSON(options: PublishOptions): Promise<PublishResult> {
    try {
      const result = await this.client.publishJSON({
        url: options.url,
        body: options.body,
        headers: options.headers,
        delay: options.delay,
        retries: options.retries,
        deduplicationId: options.deduplicationId,
        contentBasedDeduplication: options.contentBasedDeduplication,
        topic: options.topic,
        callback: options.callback,
        failureCallback: options.failureCallback,
      });

      this.logger.info({
        tag: "QStashClient",
        msg: "Message published successfully",
        data: { messageId: result.messageId, url: options.url },
      });

      return {
        messageId: result.messageId,
        url: options.url,
      };
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to publish message",
        error,
        data: { url: options.url },
      });
      throw error;
    }
  }

  /**
   * Publish a message with custom options
   */
  async publish(options: PublishOptions): Promise<PublishResult> {
    try {
      const result = await this.client.publish({
        url: options.url,
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: options.headers,
        delay: options.delay,
        retries: options.retries,
        deduplicationId: options.deduplicationId,
        contentBasedDeduplication: options.contentBasedDeduplication,
        topic: options.topic,
        callback: options.callback,
        failureCallback: options.failureCallback,
      });

      this.logger.info({
        tag: "QStashClient",
        msg: "Message published successfully",
        data: { messageId: result.messageId, url: options.url },
      });

      return {
        messageId: result.messageId,
        url: options.url,
      };
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to publish message",
        error,
        data: { url: options.url },
      });
      throw error;
    }
  }

  /**
   * Schedule a message with delay or cron
   */
  async schedule(options: ScheduleOptions): Promise<ScheduleResult> {
    try {
      if (options.cron) {
        const result = await this.client.schedules.create({
          destination: options.destination,
          cron: options.cron,
          body: options.body ? JSON.stringify(options.body) : undefined,
          headers: options.headers,
        });

        this.logger.info({
          tag: "QStashClient",
          msg: "Cron schedule created successfully",
          data: { scheduleId: result.scheduleId, destination: options.destination, cron: options.cron },
        });

        return {
          scheduleId: result.scheduleId,
          destination: options.destination,
          cron: options.cron,
        };
      } else {
        // Use delay for one-time scheduled message
        const result = await this.client.publish({
          url: options.destination,
          body: options.body ? JSON.stringify(options.body) : undefined,
          headers: options.headers,
          delay: options.delay,
        });

        this.logger.info({
          tag: "QStashClient",
          msg: "Delayed message scheduled successfully",
          data: { messageId: result.messageId, destination: options.destination, delay: options.delay },
        });

        return {
          scheduleId: result.messageId,
          destination: options.destination,
        };
      }
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to schedule message",
        error,
        data: { destination: options.destination },
      });
      throw error;
    }
  }

  /**
   * Enqueue a message to a FIFO queue
   */
  async enqueue(options: QueueOptions): Promise<PublishResult> {
    try {
      const result = await this.client.publish({
        url: options.url,
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
          ...options.headers,
          "Upstash-Queue": options.queueName,
        },
        delay: options.delay,
      });

      this.logger.info({
        tag: "QStashClient",
        msg: "Message enqueued successfully",
        data: { messageId: result.messageId, queueName: options.queueName, url: options.url },
      });

      return {
        messageId: result.messageId,
        url: options.url,
      };
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to enqueue message",
        error,
        data: { queueName: options.queueName, url: options.url },
      });
      throw error;
    }
  }

  /**
   * Publish to a topic (fan-out)
   */
  async publishToTopic(options: TopicPublishOptions): Promise<PublishResult> {
    try {
      const result = await this.client.publish({
        url: options.url,
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
          ...options.headers,
          "Upstash-Topic": options.topic,
        },
        delay: options.delay,
      });

      this.logger.info({
        tag: "QStashClient",
        msg: "Message published to topic successfully",
        data: { messageId: result.messageId, topic: options.topic, url: options.url },
      });

      return {
        messageId: result.messageId,
        url: options.url,
      };
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to publish to topic",
        error,
        data: { topic: options.topic, url: options.url },
      });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await this.client.schedules.delete(scheduleId);

      this.logger.info({
        tag: "QStashClient",
        msg: "Schedule deleted successfully",
        data: { scheduleId },
      });
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to delete schedule",
        error,
        data: { scheduleId },
      });
      throw error;
    }
  }

  /**
   * Get all schedules
   */
  async getSchedules(): Promise<ScheduleResult[]> {
    try {
      const schedules = await this.client.schedules.list();

      this.logger.info({
        tag: "QStashClient",
        msg: "Schedules retrieved successfully",
        data: { count: schedules.length },
      });

      return schedules.map((schedule: any) => ({
        scheduleId: schedule.scheduleId,
        destination: schedule.destination,
        cron: schedule.cron,
      }));
    } catch (error: any) {
      this.logger.error({
        tag: "QStashClient",
        msg: "Failed to get schedules",
        error,
      });
      throw error;
    }
  }
}
