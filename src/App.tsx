import { useState } from 'react';

// ダミーデータを生成する関数
const generateData = () => {
  return Array.from({ length: 1000 }, (_, i) => `項目 ${i + 2}`);
};

function App() {
  const [count, setCount] = useState(0);
  const data = generateData();

  return (
    <div className="app-container">
      <h1>React SSR パフォーマンス比較</h1>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          カウント: {count}
        </button>
        <p>
          このボタンはクライアントサイドでのみ機能します
        </p>
      </div>
      
      <div className="data-list">
        <h2>大量のデータ</h2>
        <ul>
          {data.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
