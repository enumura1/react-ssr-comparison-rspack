import express from 'express';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import App from './App.js';

// Express用の型定義
import { Request, Response, NextFunction } from 'express';
import { Socket } from 'net';

// Expressのレスポンス型を拡張
interface ExtendedResponse extends Response {
  socket: Socket | null;
}

// __dirname を取得するための処理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '../dist')));

// ネットワーク遅延をシミュレートするミドルウェア
const simulateNetworkDelay = (req: Request, res: Response, next: NextFunction) => {
  // 2秒のネットワーク遅延をシミュレート
  setTimeout(next, 500);
};

// 特定のアセットには遅延を適用（HTML応答ではなく）
app.use(/\.(js|css|svg|png|jpg|jpeg|gif)$/, simulateNetworkDelay);

app.get('/', (req: Request, res: ExtendedResponse) => {
  if (!res.socket) {
    res.status(500).send('Socket is not available');
    return;
  }

  res.socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // パフォーマンス測定開始
  const startTime = performance.now();
  
  // HTML Shell（最初に送信する部分）
  const htmlStart = `<!DOCTYPE html>
  <html>
    <head>
      <title>React SSR - renderToPipeableStream</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/main.css">
      <script>
        // パフォーマンス測定用のタイムスタンプ
        window.SERVER_START_TIME = ${Date.now()};
        window.RENDER_METHOD = 'renderToPipeableStream';
        
        // マーカーを設定する関数
        window.markEvent = function(name) {
          if (window.performance && window.performance.mark) {
            window.performance.mark(name);
            console.log('Performance mark: ' + name + ' at ' + (performance.now() - window.performanceStartTime) + 'ms');
          }
        };
        
        // 初期タイムスタンプを設定
        window.performanceStartTime = performance.now();
        
        // シェル到着マーク
        window.markEvent('shell-received');
      </script>
    </head>
    <body>
      <div id="root">`;
  
  const htmlEnd = `</div>
      <script src="/client-entry.js"></script>
      <script>
        // 全コンテンツ受信完了マーク
        window.markEvent('content-complete');
      </script>
    </body>
  </html>`;

  // 事前にHTMLの先頭部分を送信
  res.write(htmlStart);
  
  // renderToPipeableStream でレンダリング
  const { pipe } = renderToPipeableStream(React.createElement(App), {
    bootstrapScripts: ['/client-entry.js'],
    onShellReady() {
      // シェルが準備できた時点での時間 (FCP相当)
      const shellReadyTime = performance.now() - startTime;
      console.log(`[renderToPipeableStream] シェル準備完了時間: ${shellReadyTime.toFixed(2)}ms`);
      
      // ヘッダーを設定
      res.setHeader('Content-Type', 'text/html');
      
      // ストリーミングを開始
      pipe(res);
      
      // シェル準備時間をコンソールに表示するスクリプトを注入
      res.write(`
        <script>
          window.SERVER_SHELL_READY_TIME = ${shellReadyTime};
          console.log('Server Shell Ready Time:', ${shellReadyTime});
          // シェル準備完了マーク
          window.markEvent('shell-ready');
        </script>
      `);
    },
    onAllReady() {
      // 全コンテンツの準備完了
      const allReadyTime = performance.now() - startTime;
      console.log(`[renderToPipeableStream] 全コンテンツ準備完了時間: ${allReadyTime.toFixed(2)}ms`);
      
      // 全てのコンテンツ準備完了後に、HTML終了タグを送信
      res.write(`
        <script>
          window.SERVER_ALL_READY_TIME = ${allReadyTime};
          console.log('Server All Content Ready Time:', ${allReadyTime});
          // 全コンテンツ準備完了マーク
          window.markEvent('all-ready');
        </script>
      `);
      
      // HTMLの終了部分を送信
      res.write(htmlEnd);
      res.end();
    }
  });
});

app.listen(PORT, () => {
  console.log(`[renderToPipeableStream] サーバー起動: http://localhost:${PORT}`);
});
