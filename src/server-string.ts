import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import App from './App.js';

// __dirname を取得するための処理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/', (req, res) => {
  // パフォーマンス測定開始
  const startTime = performance.now();
  
  // renderToString でレンダリング
  const html = renderToString(React.createElement(App));
  
  // パフォーマンス測定終了
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  console.log(`[renderToString] サーバーレンダリング時間: ${renderTime.toFixed(2)}ms`);
  
  // HTMLを組み立て
  const fullHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>React SSR - renderToString</title>
      <link rel="stylesheet" href="/assets/main.css">
      <script>
        window.SERVER_RENDER_TIME = ${renderTime};
        window.RENDER_METHOD = 'renderToString';
        console.log('Server Render Time:', ${renderTime});
      </script>
    </head>
    <body>
      <div id="root">${html}</div>
      <script src="/client-entry.js"></script>
    </body>
  </html>
  `;
  
  res.send(fullHtml);
});

app.listen(PORT, () => {
  console.log(`[renderToString] サーバー起動: http://localhost:${PORT}`);
});
