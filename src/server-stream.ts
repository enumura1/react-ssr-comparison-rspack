import express from 'express';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import App from './App.js';

// __dirname を取得するための処理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/', (req, res) => {
  if (!res.socket) {
    res.status(500).send('Socket is not available');
    return;
  }

  res.socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // パフォーマンス測定開始
  const startTime = performance.now();
  
  // renderToPipeableStream でレンダリング
  const { pipe } = renderToPipeableStream(React.createElement(App), {
    bootstrapScripts: ['/client-entry.js'],
    onShellReady() {
      // シェルが準備できた時点での時間 (FCP相当)
      const shellReadyTime = performance.now() - startTime;
      console.log(`[renderToPipeableStream] シェル準備完了時間: ${shellReadyTime.toFixed(2)}ms`);
      
      // ヘッダーとシェル準備完了時間を埋め込む
      res.setHeader('Content-Type', 'text/html');
      res.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>React SSR - renderToPipeableStream</title>
          <link rel="stylesheet" href="/assets/main.css">
          <script>
            window.SERVER_SHELL_READY_TIME = ${shellReadyTime};
            window.RENDER_METHOD = 'renderToPipeableStream';
            console.log('Server Shell Ready Time:', ${shellReadyTime});
          </script>
        </head>
        <body>
          <div id="root">`);
      
      pipe(res);
      
      res.write(`</div>
        </body>
      </html>`);
    },
    onAllReady() {
      // 全コンテンツの準備完了
      const allReadyTime = performance.now() - startTime;
      console.log(`[renderToPipeableStream] 全コンテンツ準備完了時間: ${allReadyTime.toFixed(2)}ms`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`[renderToPipeableStream] サーバー起動: http://localhost:${PORT}`);
});
