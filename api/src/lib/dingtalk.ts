// 单条待办的数据：标题、是否完成，以及关联任务的标题（可为空）。
type Row = { title: string; done: boolean; taskTitle: string | null };

// 根据待办列表生成 Markdown 格式的每日提醒内容。
export function formatDailyMessage(rows: Row[]) {
  const undone = rows.filter(r => !r.done); // 筛选出尚未完成的待办。
  const date = new Date().toLocaleDateString('zh-CN'); // 按运行环境的本地时区获取今天日期，以中文习惯显示。

  // 没有待办时，返回休息提示。
  if (rows.length === 0) {
    return `### 今日待办提醒（${date}）\n\n今天没有安排任务，好好休息。`;
  }
  // 所有待办都已完成时，返回完成数量和鼓励文案。
  if (undone.length === 0) {
    return `### 今日待办提醒（${date}）\n\n今天 ${rows.length} 条任务全部完成，干得漂亮。`;
  }

  // 将未完成待办按序号逐行排列，有关联任务标题时附在后面并用斜体显示。
  const lines = undone.map((r, i) =>
    `${i + 1}. ${r.title}${r.taskTitle ? ` —— *${r.taskTitle}*` : ''}`
  ).join('\n');

  // 拼接日期、剩余数量、待办清单及完成进度，组成最终提醒消息。
  return `### 今日待办提醒（${date}）\n\n还剩 **${undone.length}** 条待办：\n\n${lines}\n\n> 已完成 ${rows.length - undone.length}/${rows.length}`;
}

// 向指定的钉钉机器人 Webhook 地址发送 Markdown 消息。
export async function sendDingTalk(webhook: string, markdownText: string) {
  const body = {
    msgtype: 'markdown', // 指定消息类型为 Markdown。
    markdown: { title: '今日待办', text: markdownText }, // 设置消息标题和正文。
  };
  // 通过 POST 请求发送 JSON 数据，并等待钉钉接口响应。
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), // 将消息对象转换为 JSON 字符串。
  });
  return res.json(); // 解析并返回响应内容，发送是否成功需由调用方检查返回结果。
}