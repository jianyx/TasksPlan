import { Router } from 'express';

export const externalRouter = Router();

// IP 定位代理
externalRouter.get('/ip-location', async (req, res) => {
  try {
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('IP 定位失败:', error);
    res.status(500).json({ error: 'IP 定位服务不可用' });
  }
});

// 天气代理
externalRouter.get('/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e: any) {
    console.error('天气请求失败:', e);
    res.status(500).json({ error: e.message });
  }
});