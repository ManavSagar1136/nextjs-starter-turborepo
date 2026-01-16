/* eslint-disable @typescript-eslint/no-explicit-any */

// Logger interface for dependency injection (same pattern as cache package)
export interface Logger {
  info: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  warn: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  error: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
}

// Default no-op logger
export const noOpLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

// QStash configuration
export interface QStashConfig {
  token: string;
  url?: string;
  currentSigningKey: string;
  nextSigningKey?: string;
}

// Publish options
export interface PublishOptions {
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
  retries?: number;
  deduplicationId?: string;
  contentBasedDeduplication?: boolean;
  topic?: string;
  callback?: string;
  failureCallback?: string;
}

// Schedule options
export interface ScheduleOptions {
  destination: string;
  cron?: string;
  delay?: string | number;
  body?: any;
  headers?: Record<string, string>;
}

// Publish result
export interface PublishResult {
  messageId: string;
  url: string;
}

// Schedule result
export interface ScheduleResult {
  scheduleId: string;
  destination: string;
  cron?: string;
}

// Verify options
export interface VerifyOptions {
  signature: string;
  body: string;
  url?: string;
  clockTolerance?: number;
}

// Verify result
export interface VerifyResult {
  valid: boolean;
  error?: string;
}

// Queue options
export interface QueueOptions {
  queueName: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
}

// Topic publish options
export interface TopicPublishOptions {
  topic: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
}
