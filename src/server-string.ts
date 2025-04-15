import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import App from './App.js';

// Express用の型定義
import { Request, Response, NextFunction } from 'express';

// __dirname を取得するための処理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '../dist')));

// ネットワーク遅延をシミュレートするミドルウェア
const simulateNetworkDelay = (req: Request, res: Response, next: NextFunction) => {
  // 2秒のネットワーク遅延をシミュレート
  setTimeout(next, 500);
};

// 特定のアセットには遅延を適用（HTML応答ではなく）
app.use(/\.(js|css|svg|png|jpg|jpeg|gif)$/, simulateNetworkDelay);

app.get('/', (req: Request, res: Response) => {
  // パフォーマンス測定開始
  const startTime = performance.now();
  
  try {
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
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/main.css">
        <script>
          // パフォーマンス測定用のタイムスタンプ
          window.SERVER_START_TIME = ${Date.now()};
          window.SERVER_RENDER_TIME = ${renderTime};
          window.RENDER_METHOD = 'renderToString';
          
          // マーカーを設定する関数
          window.markEvent = function(name) {
            if (window.performance && window.performance.mark) {
              window.performance.mark(name);
              console.log('Performance mark: ' + name + ' at ' + (performance.now() - window.performanceStartTime) + 'ms');
            }
          };
          
          // 初期タイムスタンプを設定
          window.performanceStartTime = performance.now();
          console.log('Server Render Time:', ${renderTime});
          
          // HTML受信マーク
          window.markEvent('html-received');
        </script>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/client-entry.js"></script>
        <script>
          // 全コンテンツ受信完了マーク
          window.markEvent('content-complete');
        </script>
      </body>
    </html>
    `;
    
    res.send(fullHtml);
  } catch (error) {
    console.error('Rendering error:', error);
    res.status(500).send('サーバーエラーが発生しました。');
  }
});

app.listen(PORT, () => {
  console.log(`[renderToString] サーバー起動: http://localhost:${PORT}`);
});
