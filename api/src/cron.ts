import cron from 'node-cron';
import { db } from './db';
import { users, tasks, subtasks } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { today } from './lib/date';
import { formatDailyMessage, sendDingTalk } from './lib/dingtalk';

export function startCron() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[cron] 开始推送今日待办...');
    try {
      const allUsers = await db.select().from(users)
        .where(sql`${users.dingtalkWebhook} is not null`);

      const todayStr = today();

      for (const user of allUsers) {
        try {
          const rows = await db
            .select({
              title: subtasks.title,
              done: subtasks.done,
              taskTitle: tasks.title,
            })
            .from(subtasks)
            .leftJoin(tasks, eq(subtasks.taskId, tasks.id))
            .where(and(
              eq(subtasks.userId, user.id),
              eq(subtasks.scheduledDate, todayStr),
            ));

          const text = formatDailyMessage(rows);
          await sendDingTalk(user.dingtalkWebhook!, text);
          console.log(`[cron] 推送成功: ${user.email}`);
        } catch (err) {
          console.error(`[cron] 推送失败: ${user.email}`, err);
        }
      }
      console.log('[cron] 推送完成');
    } catch (e) {
      console.error('[cron] 执行失败:', e);
    }
  }, { timezone: 'Asia/Shanghai' });

  console.log('[cron] 定时任务已启动，每天 8:00 推送');
}