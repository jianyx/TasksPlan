import express from 'express';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json())


const tasks:any[] = [];

app.get('/health', (req, res) => {
    res.json({ok: true})
})


app.get('/api/tasks', (req, res) => {
    res.json(tasks)
})

app.post('/api/tasks', (req, res) => {
    const taskUnit = {
        id: Date.now().toString(),
        title: req.body.title,
        done: false
    }

    tasks.push(taskUnit);
    res.status(201).json(taskUnit);
})

app.listen(3000, () => {
  console.log('http://localhost:3000');
});