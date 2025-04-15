import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// グローバル変数の型拡張
declare global {
  interface Window {
    SERVER_RENDER_TIME?: number;
    SERVER_SHELL_READY_TIME?: number;
    SERVER_ALL_READY_TIME?: number;
    SERVER_START_TIME?: number;
    RENDER_METHOD?: 'renderToString' | 'renderToPipeableStream';
    performanceStartTime?: number;
    markEvent?: (name: string) => void;
  }

  // グローバル変数の型拡張のみを定義
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

// LCP計測
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log('LCP:', entry.startTime);
    const lcpElement = document.getElementById('lcp-time');
    if (lcpElement) {
      lcpElement.textContent = entry.startTime.toFixed(2) + 'ms';
    }
  });
});
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

// TTI (Time to Interactive) の近似値を計測
let interactiveTime = 0;
const recordInteractiveTime = () => {
  if (interactiveTime === 0) {
    interactiveTime = performance.now();
    console.log('Interactive Time:', interactiveTime);
    const ttiElement = document.getElementById('tti-time');
    if (ttiElement) {
      ttiElement.textContent = interactiveTime.toFixed(2) + 'ms';
    }
  }
};

// クリックイベントをリッスン
document.addEventListener('click', recordInteractiveTime, { once: true });

// ハイドレーション実行
const root = document.getElementById('root');
if (root) {
  try {
    console.log('ハイドレーション開始: ', performance.now() - startHydrate);
    hydrateRoot(root, <App />);
    console.log('ハイドレーション完了: ', performance.now() - startHydrate);
    if (window.markEvent) {
      window.markEvent('hydration-complete');
    }
  } catch (error) {
    console.error('ハイドレーションエラー:', error);
  }
}

// ハイドレーション完了時の処理
window.addEventListener('load', () => {
  const hydrateTime = performance.now() - startHydrate;
  console.log('Hydration Time:', hydrateTime.toFixed(2) + 'ms');
  
  // 計測結果表示エリアを作成
  const metricsDiv = document.createElement('div');
  metricsDiv.className = 'metrics';
  metricsDiv.style.cssText = 'background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: system-ui, sans-serif;';
  
  const metricsTitle = document.createElement('h2');
  metricsTitle.textContent = 'パフォーマンス計測結果';
  metricsTitle.style.cssText = 'color: #2d3748; margin-top: 0;';
  metricsDiv.appendChild(metricsTitle);
  
  // レンダリング方法を表示
  const renderMethodP = document.createElement('p');
  renderMethodP.innerHTML = `<strong>レンダリング方法:</strong> <span style="color: #4a5568; font-weight: bold;">${window.RENDER_METHOD || 'Unknown'}</span>`;
  metricsDiv.appendChild(renderMethodP);
  
  // TTFBを計算して表示
  const ttfbP = document.createElement('p');
  const ttfb = window.SERVER_START_TIME ? performance.timing.responseStart - performance.timing.requestStart : 'N/A';
  ttfbP.innerHTML = `<strong>TTFB (Time To First Byte):</strong> <span id="ttfb-time">${typeof ttfb === 'number' ? ttfb.toFixed(2) + 'ms' : ttfb}</span>`;
  metricsDiv.appendChild(ttfbP);
  
  // FCPを表示
  const fcpP = document.createElement('p');
  fcpP.innerHTML = `<strong>FCP (First Contentful Paint):</strong> <span id="fcp-time">計測中...</span>`;
  metricsDiv.appendChild(fcpP);
  
  // LCPを表示
  const lcpP = document.createElement('p');
  lcpP.innerHTML = `<strong>LCP (Largest Contentful Paint):</strong> <span id="lcp-time">計測中...</span>`;
  metricsDiv.appendChild(lcpP);
  
  // TTIを表示
  const ttiP = document.createElement('p');
  ttiP.innerHTML = `<strong>TTI (Time To Interactive):</strong> <span id="tti-time">${interactiveTime > 0 ? interactiveTime.toFixed(2) + 'ms' : '計測中...'}</span>`;
  metricsDiv.appendChild(ttiP);
  
  // ハイドレーション時間を表示
  const hydrateP = document.createElement('p');
  hydrateP.innerHTML = `<strong>ハイドレーション時間:</strong> <span>${hydrateTime.toFixed(2)}ms</span>`;
  metricsDiv.appendChild(hydrateP);
  
  // ロード完了時間を表示
  const loadP = document.createElement('p');
  const loadTime = performance.now();
  loadP.innerHTML = `<strong>ロード完了時間:</strong> <span>${loadTime.toFixed(2)}ms</span>`;
  metricsDiv.appendChild(loadP);
  
  // サーバーレンダリング情報を追加
  if (window.RENDER_METHOD === 'renderToString' && window.SERVER_RENDER_TIME) {
    const serverP = document.createElement('p');
    serverP.innerHTML = `<strong>サーバーレンダリング時間 (renderToString):</strong> <span style="color: #e53e3e; font-weight: bold;">${window.SERVER_RENDER_TIME.toFixed(2)}ms</span>`;
    metricsDiv.appendChild(serverP);
  } else if (window.RENDER_METHOD === 'renderToPipeableStream') {
    if (window.SERVER_SHELL_READY_TIME) {
      const shellP = document.createElement('p');
      shellP.innerHTML = `<strong>サーバーシェル準備時間 (renderToPipeableStream):</strong> <span style="color: #38a169; font-weight: bold;">${window.SERVER_SHELL_READY_TIME.toFixed(2)}ms</span>`;
      metricsDiv.appendChild(shellP);
    }
    
    if (window.SERVER_ALL_READY_TIME) {
      const allReadyP = document.createElement('p');
      allReadyP.innerHTML = `<strong>サーバー全コンテンツ準備時間 (renderToPipeableStream):</strong> <span style="color: #4299e1; font-weight: bold;">${window.SERVER_ALL_READY_TIME.toFixed(2)}ms</span>`;
      metricsDiv.appendChild(allReadyP);
    }
  }
  
  // 説明文
  const explanationDiv = document.createElement('div');
  explanationDiv.style.cssText = 'margin-top: 20px; padding: 15px; background: #e6fffa; border-radius: 5px; font-size: 0.9em;';
  
  if (window.RENDER_METHOD === 'renderToString') {
    explanationDiv.innerHTML = `
      <p><strong>renderToString</strong>: すべてのHTMLコンテンツを一度に生成し送信します。サーバーでの処理が完了するまでクライアントは何も表示できません。</p>
    `;
  } else if (window.RENDER_METHOD === 'renderToPipeableStream') {
    explanationDiv.innerHTML = `
      <p><strong>renderToPipeableStream</strong>: HTMLを段階的に生成・送信します。重要なコンテンツ（シェル）が先に表示され、残りは後から届きます。</p>
    `;
  }
  
  metricsDiv.appendChild(explanationDiv);
  
  // bodyの先頭に追加
  document.body.insertBefore(metricsDiv, document.body.firstChild);
});
