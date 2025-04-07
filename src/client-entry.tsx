import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// グローバル変数の型拡張
declare global {
  interface Window {
    SERVER_RENDER_TIME?: number;
    SERVER_SHELL_READY_TIME?: number;
    RENDER_METHOD?: string;
  }
}

// パフォーマンス計測
const startHydrate = performance.now();

// FCP計測
const perfObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.name === 'first-contentful-paint') {
      console.log('FCP:', entry.startTime);
      const fcpElement = document.getElementById('fcp-time');
      if (fcpElement) {
        fcpElement.textContent = entry.startTime.toFixed(2) + 'ms';
      }
    }
  });
});
perfObserver.observe({ type: 'paint', buffered: true });

// ハイドレーション実行
const root = document.getElementById('root');
if (root) {
  hydrateRoot(root, <App />);
}

// ハイドレーション完了時の処理
window.addEventListener('load', () => {
  const hydrateTime = performance.now() - startHydrate;
  console.log('Hydration Time:', hydrateTime.toFixed(2) + 'ms');
  
  // 計測結果表示エリアを作成
  const metricsDiv = document.createElement('div');
  metricsDiv.className = 'metrics';
  metricsDiv.style.cssText = 'background: #f0f0f0; padding: 10px; margin: 20px; border-radius: 4px;';
  
  const metricsTitle = document.createElement('h2');
  metricsTitle.textContent = '計測結果';
  metricsDiv.appendChild(metricsTitle);
  
  const fcpP = document.createElement('p');
  fcpP.innerHTML = `FCP時間: <span id="fcp-time">計測中...</span>`;
  metricsDiv.appendChild(fcpP);
  
  const loadP = document.createElement('p');
  const loadTime = performance.now();
  loadP.innerHTML = `ロード完了時間: <span>${loadTime.toFixed(2)}ms</span>`;
  metricsDiv.appendChild(loadP);
  
  const hydrateP = document.createElement('p');
  hydrateP.innerHTML = `ハイドレーション時間: <span>${hydrateTime.toFixed(2)}ms</span>`;
  metricsDiv.appendChild(hydrateP);
  
  // サーバーレンダリング情報を追加
  if (window.RENDER_METHOD === 'renderToString' && window.SERVER_RENDER_TIME) {
    const serverP = document.createElement('p');
    serverP.innerHTML = `サーバーレンダリング時間 (renderToString): <span>${window.SERVER_RENDER_TIME.toFixed(2)}ms</span>`;
    metricsDiv.appendChild(serverP);
  } else if (window.RENDER_METHOD === 'renderToPipeableStream' && window.SERVER_SHELL_READY_TIME) {
    const serverP = document.createElement('p');
    serverP.innerHTML = `サーバーシェル準備時間 (renderToPipeableStream): <span>${window.SERVER_SHELL_READY_TIME.toFixed(2)}ms</span>`;
    metricsDiv.appendChild(serverP);
  }
  
  // bodyの先頭に追加
  document.body.insertBefore(metricsDiv, document.body.firstChild);
});
