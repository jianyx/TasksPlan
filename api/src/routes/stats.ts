import { Router } from 'express'; // 创建 Express 路由。
import { db } from '../db'; // 数据库查询入口。
import { tasks, subtasks } from '../db/schema'; // 主任务和子任务的表定义。
import { eq, and, sql } from 'drizzle-orm'; // 分别用于相等判断、组合条件和编写参数化 SQL 片段。
import { authMiddleware } from '../middleware/auth'; // 验证登录身份，并将用户 ID 写入 req.userId。
import { fmtDate, today } from '../lib/date'; // 格式化日期，以及获取今天的日期字符串。

export const statsRouter = Router();
statsRouter.use(authMiddleware); // 该路由下的所有接口都需要先通过身份认证。

// 返回当前用户的今日统计、本周统计、连续完成天数和进行中的主任务数。
statsRouter.get('/overview', async (req: any, res) => {
  try {
    const now = new Date();
    const todayStr = today(); // 按服务器本地时区获取今天的 YYYY-MM-DD 日期。

    // 计算本周一和本周日，以周一作为一周的开始。
    const dow = now.getDay() === 0 ? 7 : now.getDay(); // 将周日从 0 改为 7，统一为周一到周日对应 1～7。
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow - 1)); // 从今天回退到本周一。
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // 从周一向后推六天，得到本周日。

    // 查询当前用户安排在今天的子任务，按计划日期统计，而不是按实际完成时间统计。
    const todayRows = await db.select().from(subtasks).where(and(
      eq(subtasks.userId, req.userId),
      eq(subtasks.scheduledDate, todayStr),
    ));
    const todayTotal = todayRows.length; // 今日子任务总数。
    const todayDone = todayRows.filter(r => r.done).length; // 今日子任务中已完成的数量。

    // 查询当前用户本周一到周日的子任务，包含两端日期，也包含本周尚未到来的日期。
    const weekRows = await db.select().from(subtasks).where(and(
      eq(subtasks.userId, req.userId),
      sql`${subtasks.scheduledDate} >= ${fmtDate(monday)}`,
      sql`${subtasks.scheduledDate} <= ${fmtDate(sunday)}`,
    ));
    const weekTotal = weekRows.length; // 本周子任务总数。
    const weekDone = weekRows.filter(r => r.done).length; // 本周子任务中已完成的数量。

    // 查询当前用户状态为 active 的主任务，只读取 ID，最后用结果条数作为任务数。
    const activeRows = await db.select({ id: tasks.id }).from(tasks).where(and(
      eq(tasks.userId, req.userId),
      eq(tasks.status, 'active'),
    ));

    // 查询从 60 天前到今天的子任务（含两端，共 61 个日期），供后续计算连续完成天数。
    const since = new Date(now);
    since.setDate(now.getDate() - 60);
    const recent = await db.select().from(subtasks).where(and(
      eq(subtasks.userId, req.userId),
      sql`${subtasks.scheduledDate} >= ${fmtDate(since)}`,
      sql`${subtasks.scheduledDate} <= ${todayStr}`,
    ));

    // 按计划日期分组，记录每天的子任务总数和已完成数。
    const byDate = new Map<string, { total: number; done: number }>();
    for (const r of recent) {
      const key = String(r.scheduledDate);
      const cur = byDate.get(key) || { total: 0, done: 0 }; // 首次遇到该日期时，从零开始计数。
      cur.total++;
      if (r.done) cur.done++;
      byDate.set(key, cur); // 保存该日期更新后的统计结果。
    }

    // 从今天向前检查最多 60 个自然日，累计其中任务全部完成的天数。
    // 没有任务的日期直接跳过，不增加天数，也不会中断连续记录。
    let streak = 0;
    const cursor = new Date(now);
    for (let i = 0; i < 60; i++) {
      const key = fmtDate(cursor);
      const stat = byDate.get(key);
      if (stat && stat.total > 0) {
        if (stat.done === stat.total) streak++; // 当天有任务且全部完成，累计一天。
        else break; // 遇到有未完成任务的日期就停止，今天未完成也会直接得到 0。
      }
      cursor.setDate(cursor.getDate() - 1); // 继续检查前一天。
    }

    // 将汇总结果作为 JSON 返回给前端。
    res.json({
      todayDone, todayTotal, // 今日已完成数和总数。
      weekDone, weekTotal, // 本周已完成数和总数。
      streak, // 按上述跳过无任务日的规则计算的连续完成天数。
      activeTasks: activeRows.length, // 当前进行中的主任务数。
    });
  } catch (e: any) {
    console.error(e); // 在服务端记录异常，便于排查问题。
    res.status(500).json({ error: e.message }); // 发生异常时，返回 500 和错误信息。
  }
});

// ===== 本周热力图数据 =====
statsRouter.get('/week', async (req: any, res) => {
  try {
    const now = new Date();
    // 获取本周一
    const dow = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(fmtDate(d));
    }

    // 查询这 7 天的所有子任务
    const rows = await db.select().from(subtasks).where(and(
      eq(subtasks.userId, req.userId),
      sql`${subtasks.scheduledDate} >= ${days[0]}`,
      sql`${subtasks.scheduledDate} <= ${days[6]}`,
    ));

    // 按日期汇总
    const map = new Map<string, { total: number; done: number }>();
    days.forEach(d => map.set(d, { total: 0, done: 0 }));

    for (const r of rows) {
      const key = String(r.scheduledDate);
      const stat = map.get(key);
      if (stat) {
        stat.total++;
        if (r.done) stat.done++;
      }
    }

    // 返回 7 天的数据，按周一到周日排列
    const result = days.map(date => ({
      date,
      total: map.get(date)!.total,
      done: map.get(date)!.done,
    }));

    res.json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});