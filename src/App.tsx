import { useState, Suspense, lazy } from 'react';

// 遅延読み込みするコンポーネントの型定義
interface HeavyComponentType {
  default: React.ComponentType;
}

// 遅延読み込みするコンポーネント
const HeavyComponent = lazy((): Promise<HeavyComponentType> => {
  // 重いコンポーネントをシミュレート
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <div className="heavy-component">
            <h2>重いコンポーネント（遅延読み込み）</h2>
            <p>このコンポーネントは意図的に遅延読み込みされます。renderToPipeableStreamでは他のコンテンツが先に表示されるはずです。</p>
            <div className="big-box" style={{ height: '200px', background: '#f0ad4e', padding: '10px', borderRadius: '5px' }}>
              大きなコンテンツブロック
            </div>
          </div>
        )
      });
    }, 1000); // 1秒の遅延を加える
  });
});

// より複雑なダミーデータを生成する関数
const generateData = () => {
  // 10倍のデータ量に増加
  return Array.from({ length: 5000 }, (_, i) => ({
    id: i + 1,
    title: `項目 ${i + 1}`,
    description: `これは項目 ${i + 1} の説明文です。ここにはもっと長いテキストが入ります。`,
    value: Math.floor(Math.random() * 1000),
    category: i % 5 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C',
    timestamp: new Date().toISOString()
  }));
};

// データアイテムの型定義
interface DataItem {
  id: number;
  title: string;
  description: string;
  value: number;
  category: string;
  timestamp: string;
}

// DataSubsetコンポーネントのプロパティの型定義
interface DataSubsetProps {
  data: DataItem[];
  category: string;
  title: string;
}

// ダミーデータのサブセットを表示するコンポーネント
const DataSubset = ({ data, category, title }: DataSubsetProps) => (
  <div className="data-subset">
    <h3>{title}</h3>
    <div className="data-grid">
      {data
        .filter(item => item.category === category)
        .slice(0, 50) // 最初の50件だけ表示
        .map(item => (
          <div key={item.id} className="data-item">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <span className="value">値: {item.value}</span>
          </div>
        ))}
    </div>
  </div>
);

function App() {
  const [count, setCount] = useState(0);
  const [showAllData, setShowAllData] = useState(false);
  const data = generateData();

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#4a5568', color: 'white', borderRadius: '5px' }}>
        <h1>React SSR パフォーマンス比較</h1>
        <p>renderToString vs renderToPipeableStream の違いを確認します</p>
      </header>
      
      <div className="interactive-section" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: '#edf2f7', 
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <div className="card">
          <button 
            onClick={() => setCount((count) => count + 1)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4299e1', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            カウント: {count}
          </button>
          <p>
            このボタンはクライアントサイドでのみ機能します
          </p>
        </div>
        
        <div className="card">
          <button 
            onClick={() => setShowAllData(!showAllData)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#48bb78', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {showAllData ? 'データを隠す' : 'すべてのデータを表示'}
          </button>
        </div>
      </div>
      
      {/* 最初に表示される重要なコンテンツ */}
      <div className="important-content" style={{ 
        backgroundColor: '#ebf8ff', 
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h2>重要なコンテンツ（最初に表示されるべき）</h2>
        <p>このセクションは最も重要なので、できるだけ早く表示されるべきです。</p>
        <p>renderToPipeableStreamではこのコンテンツが先に表示され、残りのコンテンツは後から段階的に表示されるはずです。</p>
      </div>
      
      {/* Suspenseを使用して遅延コンポーネントを囲む */}
      <Suspense fallback={<div className="loading">重いコンポーネントを読み込み中...</div>}>
        <HeavyComponent />
      </Suspense>
      
      {/* データの一部を表示するセクション - これはSuspenseの外にあるので早く表示される */}
      <div className="data-categories" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px',
        marginTop: '20px'
      }}>
        <DataSubset data={data} category="A" title="カテゴリーA" />
        <DataSubset data={data} category="B" title="カテゴリーB" />
      </div>
      
      {/* スクロールして表示されるような大量データ部分 */}
      {showAllData && (
        <div className="all-data" style={{ marginTop: '30px' }}>
          <h2>大量のデータ</h2>
          <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px' }}>
            <ul>
              {data.map((item) => (
                <li key={item.id} style={{ padding: '8px', borderBottom: '1px solid #edf2f7' }}>
                  <strong>{item.title}</strong> - {item.description} ({item.category}) <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
