import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMsg: string; }

export class MarkdownErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
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
          <strong>⚠️ 渲染分析报告时发生异常：</strong>
          <br />
          请尝试重新分析，或检查返回的内容格式。
          <p className="mt-2 text-xs text-red-400 font-mono">{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}