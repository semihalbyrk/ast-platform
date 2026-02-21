import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Amsterdam Scrap Terminal
        </h1>
        <p className="mt-2 text-gray-600">Operations Platform</p>
        <p className="mt-4 text-sm text-green-600">
          API: <a href="/api" className="underline">http://localhost:3000/api</a>
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
