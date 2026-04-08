import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Global Crash Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#333' }}>
          <h1 style={{ color: '#e53e3e' }}>应用发生致命错误</h1>
          <p>很抱歉，应用崩溃了。请将以下错误信息截图反馈：</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', color: '#e53e3e' }}>
            {this.state.error?.toString() || 'Unknown Error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            重新加载页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);