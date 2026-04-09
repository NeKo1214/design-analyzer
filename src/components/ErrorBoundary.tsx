import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; resetKey?: unknown; }
interface State { hasError: boolean; errorMsg: string; }

export class MarkdownErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  // #9: props 变化时（如 resetKey 更新）自动重置错误状态
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (state.hasError && props.resetKey !== undefined) {
      return { hasError: false, errorMsg: '' };
    }
    return null;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Markdown Render Crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <strong>⚠️ 渲染分析报告时发生异常</strong>
          <p className="mt-2 text-xs text-red-400 font-mono">{this.state.errorMsg}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            重试渲染
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}