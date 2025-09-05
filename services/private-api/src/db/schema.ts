import { mysqlTable, varchar, int, datetime, text, boolean, json, index, uniqueIndex, primaryKey } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const companies = mysqlTable('companies', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  supportPhone: varchar('support_phone', { length: 20 }),
  settings: json('settings').$type<{
    greeting?: string;
    departments?: string[];
    businessHours?: Record<string, any>;
    voiceSettings?: Record<string, any>;
  }>(),
  dataCollectionFields: json('data_collection_fields').$type<{
    standardFields?: {
      contactNumber?: boolean;
      companyName?: boolean;
      callerName?: boolean;
      email?: boolean;
      reasonForCalling?: boolean;
    };
    customFields?: Array<{
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'boolean';
      required: boolean;
      options?: string[];
      aiPrompt?: string;
    }>;
    collectionOrder?: string[];
  }>().default({
    standardFields: {
      contactNumber: true,
      companyName: true,
      callerName: true,
      reasonForCalling: true,
    },
    customFields: [],
  }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('company_slug_idx').on(table.slug),
}));

export const phoneNumbers = mysqlTable('phone_numbers', {
  id: int('id').autoincrement().primaryKey(),
  companyId: int('company_id').notNull().references(() => companies.id),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  type: varchar('type', { length: 50 }).default('main'), // main, support, sales, etc.
  instructions: text('instructions'), // AI agent instructions specific to this number
  supportNumber: varchar('support_number', { length: 20 }), // Number to transfer support calls to
  metadata: json('metadata').$type<{
    departments?: Array<{
      name: string;
      transferNumber: string;
      description?: string;
    }>;
    voiceSettings?: {
      voice?: string;
      language?: string;
      temperature?: number;
    };
    businessHours?: Record<string, any>;
  }>(),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  phoneNumberIdx: uniqueIndex('phone_number_idx').on(table.phoneNumber),
  companyIdx: index('phone_company_idx').on(table.companyId),
}));

export const contacts = mysqlTable('contacts', {
  id: int('id').autoincrement().primaryKey(),
  companyId: int('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  companyName: varchar('company_name', { length: 255 }),
  department: varchar('department', { length: 100 }),
  role: varchar('role', { length: 100 }),
  preferredContactMethod: varchar('preferred_contact_method', { length: 50 }),
  notes: text('notes'),
  tags: json('tags').$type<string[]>().default([]),
  customFields: json('custom_fields').$type<Record<string, any>>().default({}),
  lastContactedAt: datetime('last_contacted_at'),
  totalCalls: int('total_calls').default(0),
  averageCallDuration: int('average_call_duration').default(0),
  isVip: boolean('is_vip').default(false),
  isBlocked: boolean('is_blocked').default(false),
  isInternal: boolean('is_internal').default(false),
  allowCallTransfer: boolean('allow_call_transfer').default(false),
  directExtension: varchar('direct_extension', { length: 20 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  companyIdx: index('contact_company_idx').on(table.companyId),
  phoneIdx: index('contact_phone_idx').on(table.phoneNumber),
  emailIdx: index('contact_email_idx').on(table.email),
  nameIdx: index('contact_name_idx').on(table.name),
  companyPhoneIdx: uniqueIndex('company_phone_idx').on(table.companyId, table.phoneNumber),
}));

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  companyId: int('company_id').notNull().references(() => companies.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  role: varchar('role', { length: 50 }).default('user'), // admin, manager, user
  isActive: boolean('is_active').default(true),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
  usernameIdx: uniqueIndex('username_idx').on(table.username),
  companyIdx: index('company_idx').on(table.companyId),
}));

export const apiKeys = mysqlTable('api_keys', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  key: varchar('key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  permissions: json('permissions').$type<string[]>().default([]),
  lastUsedAt: datetime('last_used_at'),
  expiresAt: datetime('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('key_idx').on(table.key),
  userIdx: index('user_idx').on(table.userId),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: varchar('resource_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
}));

export const calls = mysqlTable('calls', {
  id: int('id').autoincrement().primaryKey(),
  companyId: int('company_id').references(() => companies.id),
  phoneNumberId: int('phone_number_id').references(() => phoneNumbers.id),
  contactId: int('contact_id').references(() => contacts.id),
  callSid: varchar('call_sid', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  calledNumber: varchar('called_number', { length: 20 }),
  status: varchar('status', { length: 50 }).default('in_progress'),
  department: varchar('department', { length: 50 }),
  transferReason: text('transfer_reason'),
  resolution: text('resolution'),
  customerSatisfied: boolean('customer_satisfied'),
  conversationSummary: text('conversation_summary'),
  collectedData: json('collected_data').$type<{
    callerName?: string;
    companyName?: string;
    contactNumber?: string;
    email?: string;
    reasonForCalling?: string;
    customFields?: Record<string, any>;
    collectedAt?: string;
  }>(),
  metadata: json('metadata').$type<Record<string, any>>(),
  startedAt: datetime('started_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  endedAt: datetime('ended_at'),
  duration: int('duration'),
}, (table) => ({
  callSidIdx: uniqueIndex('call_sid_idx').on(table.callSid),
  statusIdx: index('status_idx').on(table.status),
  startedAtIdx: index('started_at_idx').on(table.startedAt),
  companyIdx: index('call_company_idx').on(table.companyId),
  phoneNumberIdx: index('call_phone_number_idx').on(table.phoneNumberId),
  contactIdx: index('call_contact_idx').on(table.contactId),
}));

export const callTranscripts = mysqlTable('call_transcripts', {
  id: int('id').autoincrement().primaryKey(),
  callId: int('call_id').notNull().references(() => calls.id),
  role: varchar('role', { length: 20 }).notNull(),
  text: text('text').notNull(),
  timestamp: datetime('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
}, (table) => ({
  callIdx: index('transcript_call_idx').on(table.callId),
  timestampIdx: index('transcript_timestamp_idx').on(table.timestamp),
}));

export const callEvents = mysqlTable('call_events', {
  id: int('id').autoincrement().primaryKey(),
  callId: int('call_id').notNull().references(() => calls.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: json('event_data').$type<Record<string, any>>(),
  timestamp: datetime('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  callIdx: index('event_call_idx').on(table.callId),
  eventTypeIdx: index('event_type_idx').on(table.eventType),
  timestampIdx: index('event_timestamp_idx').on(table.timestamp),
}));

export const callbackSchedules = mysqlTable('callback_schedules', {
  id: int('id').autoincrement().primaryKey(),
  callId: int('call_id').references(() => calls.id),
  callbackId: varchar('callback_id', { length: 100 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  preferredTime: varchar('preferred_time', { length: 100 }),
  topic: text('topic'),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  scheduledFor: datetime('scheduled_for'),
  completedAt: datetime('completed_at'),
}, (table) => ({
  callbackIdIdx: uniqueIndex('callback_id_idx').on(table.callbackId),
  statusIdx: index('callback_status_idx').on(table.status),
  scheduledForIdx: index('scheduled_for_idx').on(table.scheduledFor),
}));

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type NewPhoneNumber = typeof phoneNumbers.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type CallTranscript = typeof callTranscripts.$inferSelect;
export type NewCallTranscript = typeof callTranscripts.$inferInsert;
export type CallEvent = typeof callEvents.$inferSelect;
export type NewCallEvent = typeof callEvents.$inferInsert;
export type CallbackSchedule = typeof callbackSchedules.$inferSelect;
export type NewCallbackSchedule = typeof callbackSchedules.$inferInsert;