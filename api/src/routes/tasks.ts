import { Router } from 'express';
import { db } from '../db';
import { tasks, subtasks } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { eachDay, today } from '../lib/date';
import OpenAI from 'openai';

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);

// 统计进度的公共片段
const statSelect = {
  total: sql<number>`count(*)::int`,
  done: sql<number>`coalesce(sum(case when ${subtasks.done} then 1 else 0 end), 0)::int`,
};

async function attachProgress(list: any[]) {
  return Promise.all(list.map(async (t) => {
    const [stat] = await db.select(statSelect)
      .from(subtasks)
      .where(eq(subtasks.taskId, t.id));
    return { ...t, total: stat.total, done: stat.done };
  }));
}

// ===== 创建主任务 =====
tasksRouter.post('/', async (req: any, res) => {
  try {
    console.log('创建任务时的 req.userId:', req.userId);

    if (!req.userId) {
      return res.status(401).json({ error: '无效的用户身份，请重新登录' });
    }

    const { title, description, startDate, endDate, dailySubtasks, customSubtasks } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: '标题、开始日期、结束日期必填' });
    }
    
    // 2. 校验逻辑必须改成：只要有一个存在即可
    const hasDaily = Array.isArray(dailySubtasks) && dailySubtasks.length > 0;
    const hasCustom = Array.isArray(customSubtasks) && customSubtasks.length > 0;
    
    if (!hasDaily && !hasCustom) {
      return res.status(400).json({ error: '至少需要一条任务' });
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: '开始日期不能晚于结束日期' });
    }

    // ... 插入主任务的代码保持不变 ...
    const [task] = await db.insert(tasks).values({ 
      userId: req.userId, // ← 必须有这行，且拼写是 userId
      title,
      description: description || null,
      startDate,
      endDate,
      status: 'active',
    } ).returning();

    // 3. 修改子任务生成逻辑
    const rows: any[] = [];

    if (customSubtasks && customSubtasks.length > 0) {
    // 模式 A：按天定制的任务（AI 或手动指定了日期）
    customSubtasks.forEach((st: { date: string; title: string }, i: number) => {
        rows.push({
        taskId: task.id,
        userId: req.userId,
        title: st.title,
        scheduledDate: st.date,
        sortOrder: i,
        });
    });
    } else if (dailySubtasks && dailySubtasks.length > 0) {
    // 模式 B：每日重复的任务
    const days = eachDay(startDate, endDate);
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
    }

    await db.insert(subtasks).values(rows);
    res.status(201).json({ task, subtaskCount: rows.length });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 进行中的主任务 =====
tasksRouter.get('/', async (req: any, res) => {
  try {
    const list = await db.select().from(tasks)
      .where(and(eq(tasks.userId, req.userId), eq(tasks.status, 'active')));
    res.json(await attachProgress(list));
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 历史归档（必须在 /:id 之前）=====
tasksRouter.get('/history', async (req: any, res) => {
  try {
    const list = await db.select().from(tasks)
      .where(and(eq(tasks.userId, req.userId), eq(tasks.status, 'completed')))
      .orderBy(sql`${tasks.completedAt} desc nulls last`);
    res.json(await attachProgress(list));
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 今日待办（必须在 /:id 之前）=====
tasksRouter.get('/today', async (req: any, res) => {
  try {
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
        eq(subtasks.scheduledDate, today()),
      ));
    res.json(rows);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== AI 拆解（必须在 /:id 之前）=====
tasksRouter.post('/ai-plan', async (req: any, res) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: '请填写目标' });

    const aiClient = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    const todayStr = new Date().toISOString().slice(0, 10);
    const completion = await aiClient.chat.completions.create({
      model: 'deepseek-flash',
      messages: [
        {
          role: 'system',
          content: '你是一个任务规划助手。用户会告诉你一个目标，你需要建议合理的时间范围，并制定每一天的具体任务计划。只返回 JSON，不要任何解释文字。',
        },
        {
          role: 'user',
          content: `今天是 ${todayStr}。用户目标："${goal}"。请返回 JSON，格式如下：{"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "customSubtasks": [{"date": "YYYY-MM-DD", "title": "当天的具体任务"}]}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const plan = JSON.parse(completion.choices[0].message.content!);
    res.json(plan);
  } catch (e: any) {
    console.error('AI 规划失败:', e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 单个任务详情 =====
tasksRouter.get('/:id', async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [task] = await db.select().from(tasks).where(and(
      eq(tasks.id, id),
      eq(tasks.userId, req.userId),
    ));
    if (!task) return res.status(404).json({ error: 'Not found' });

    const subs = await db.select().from(subtasks)
      .where(eq(subtasks.taskId, id))
      .orderBy(subtasks.scheduledDate, subtasks.sortOrder);

    const total = subs.length;
    const done = subs.filter(s => s.done).length;

    res.json({ ...task, subtasks: subs, total, done });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 编辑主任务 =====
tasksRouter.patch('/:id', async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, startDate, endDate } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }

    const [updated] = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, req.userId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 删除主任务 =====
tasksRouter.delete('/:id', async (req: any, res) => {
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

// ===== 勾选子任务（放在单独的 subtasks router 也行，这里合并进来）=====
export const subtasksRouter = Router();
subtasksRouter.use(authMiddleware);

subtasksRouter.patch('/:id', async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { done } = req.body;

    const [updated] = await db.update(subtasks)
      .set({ done })
      .where(and(eq(subtasks.id, id), eq(subtasks.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    const [stat] = await db.select(statSelect)
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

// ===== 单个任务详情 =====
subtasksRouter.get('/api/tasks/:id', authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [task] = await db.select().from(tasks).where(and(
      eq(tasks.id, id),
      eq(tasks.userId, req.userId),
    ));
    if (!task) return res.status(404).json({ error: 'Not found' });

    const subs = await db.select().from(subtasks)
      .where(eq(subtasks.taskId, id))
      .orderBy(subtasks.scheduledDate, subtasks.sortOrder);

    const total = subs.length;
    const done = subs.filter(s => s.done).length;

    res.json({ ...task, subtasks: subs, total, done });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== 编辑主任务 =====
subtasksRouter.patch('/api/tasks/:id', authMiddleware, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, startDate, endDate } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }

    const [updated] = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, req.userId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});