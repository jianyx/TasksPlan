import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { tasks, subtasks, users } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/health', (req, res) => res.json({ ok: true }));

// ========== 认证 ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码必填' });
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) return res.status(400).json({ error: '邮箱已注册' });
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return res.status(400).json({ error: '邮箱或密码错误' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: '邮箱或密码错误' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ========== 工具：展开日期区间 ==========
function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ========== 创建主任务（自动生成子任务） ==========
app.post('/api/tasks', authMiddleware, async (req: any, res) => {
  try {
    const { title, description, startDate, endDate, dailySubtasks } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: '标题、开始日期、结束日期必填' });
    }
    if (!Array.isArray(dailySubtasks) || dailySubtasks.length === 0) {
      return res.status(400).json({ error: '至少需要一条每日子任务' });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: '开始日期不能晚于结束日期' });
    }

    const [task] = await db.insert(tasks).values({
      userId: req.userId,
      title,
      description: description || null,
      startDate,
      endDate,
      status: 'active',
    }).returning();

    const days = eachDay(startDate, endDate);
    const rows: any[] = [];
    for (const day of days) {
      dailySubtasks.forEach((st: string, i: number) => {
        rows.push({
          taskId: task.id,
          userId: req.userId,
          title: st,
          scheduledDate: day,
          sortOrder: i,
        });
      });
    }
    await db.insert(subtasks).values(rows);

    res.status(201).json({ task, subtaskCount: rows.length });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ========== 主任务列表（含进度） ==========
app.get('/api/tasks', authMiddleware, async (req: any, res) => {
  try {
    const list = await db.select().from(tasks).where(eq(tasks.userId, req.userId));
    const withProgress = await Promise.all(list.map(async (t) => {
      const [stat] = await db
        .select({
          total: sql<number>`count(*)::int`,
          done: sql<number>`coalesce(sum(case when ${subtasks.done} then 1 else 0 end), 0)::int`,
        })
        .from(subtasks)
        .where(eq(subtasks.taskId, t.id));
      return { ...t, total: stat.total, done: stat.done };
    }));
    res.json(withProgress);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ========== 今日待办 ==========
app.get('/api/tasks/today', authMiddleware, async (req: any, res) => {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;

    const rows = await db
      .select({
        id: subtasks.id,
        taskId: subtasks.taskId,
        title: subtasks.title,
        done: subtasks.done,
        scheduledDate: subtasks.scheduledDate,
        taskTitle: tasks.title,
      })
      .from(subtasks)
      .leftJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(
        eq(subtasks.userId, req.userId),
        eq(subtasks.scheduledDate, today),
      ));
    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ========== 勾选子任务 + 自动归档主任务 ==========
app.patch('/api/subtasks/:id', authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { done } = req.body;

    const [updated] = await db.update(subtasks)
      .set({ done })
      .where(and(eq(subtasks.id, id), eq(subtasks.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    const [stat] = await db
      .select({
        total: sql<number>`count(*)::int`,
        done: sql<number>`coalesce(sum(case when ${subtasks.done} then 1 else 0 end), 0)::int`,
      })
      .from(subtasks)
      .where(eq(subtasks.taskId, updated.taskId));

    if (stat.total > 0 && stat.done === stat.total) {
      await db.update(tasks)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(tasks.id, updated.taskId));
    } else {
      await db.update(tasks)
        .set({ status: 'active', completedAt: null })
        .where(and(eq(tasks.id, updated.taskId), eq(tasks.status, 'completed')));
    }

    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ========== 删除主任务（连带子任务） ==========
app.delete('/api/tasks/:id', authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(subtasks).where(and(eq(subtasks.taskId, id), eq(subtasks.userId, req.userId)));
    const [deleted] = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, req.userId)))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => console.log('http://localhost:3001'));