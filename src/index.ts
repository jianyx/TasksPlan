import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { tasks, users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// 认证中间件
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

// 注册
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
    console.error('完整错误:', e);
    console.error('cause:', e.cause);
    res.status(500).json({ error: e.message, cause: String(e.cause) });
  }
});

// 登录
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

// 任务接口（需登录）
app.get('/api/tasks', authMiddleware, async (req: any, res) => {
  const result = await db.select().from(tasks).where(eq(tasks.userId, req.userId));
  res.json(result);
});

app.post('/api/tasks', authMiddleware, async (req: any, res) => {
  const [task] = await db.insert(tasks)
    .values({ userId: req.userId, title: req.body.title })
    .returning();
  res.status(201).json(task);
});

app.listen(3000, () => console.log('http://localhost:3000'));