import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { tasksRouter, subtasksRouter } from './routes/tasks';
import { statsRouter } from './routes/stats';
import { externalRouter } from './routes/external';
import { startCron } from './cron';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/user', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/subtasks', subtasksRouter);
app.use('/api/stats', statsRouter);
app.use('/api', externalRouter);

app.listen(3001, () => console.log('http://localhost:3001'));

startCron();