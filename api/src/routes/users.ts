import { Router } from 'express';
import { db } from '../db';
import { users, subtasks, tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { today } from '../lib/date';
import { formatDailyMessage, sendDingTalk } from '../lib/dingtalk';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get('/me', async (req: any, res) => {
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    dingtalkWebhook: users.dingtalkWebhook,
  }).from(users).where(eq(users.id, req.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

usersRouter.patch('/webhook', async (req: any, res) => {
  const { webhook } = req.body;
  if (typeof webhook !== 'string') return res.status(400).json({ error: 'Invalid webhook' });
  await db.update(users)
    .set({ dingtalkWebhook: webhook || null })
    .where(eq(users.id, req.userId));
  res.json({ ok: true });
});

usersRouter.post('/test-notify', async (req: any, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId));
    if (!user?.dingtalkWebhook) return res.status(400).json({ error: '请先配置 Webhook' });

    const rows = await db
      .select({
        title: subtasks.title,
        done: subtasks.done,
        taskTitle: tasks.title,
      })
      .from(subtasks)
      .leftJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(
        eq(subtasks.userId, req.userId),
        eq(subtasks.scheduledDate, today()),
      ));

    const text = formatDailyMessage(rows);
    const result = await sendDingTalk(user.dingtalkWebhook, text);
    res.json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});