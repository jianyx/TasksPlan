import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  uuid,
  date,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  dingtalkWebhook: text('dingtalk_webhook'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').default('active').notNull(),
  templateId: integer('template_id'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subtasks = pgTable('subtasks', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  done: boolean('done').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskTemplates = pgTable('task_templates', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  defaultDuration: integer('default_duration').default(30).notNull(),
  subtaskPattern: jsonb('subtask_pattern').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});