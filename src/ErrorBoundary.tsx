import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** 防止未捕获渲染错误导致 SillyTavern 楼层只剩空白容器 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AC_OS] render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          className="p-4 text-sm font-mono text-red-100 bg-red-950/90 border border-red-500/50 min-h-[12rem]"
          style={{ boxSizing: 'border-box' }}
        >
          <p className="font-bold mb-2">AC_OS 界面加载失败（错误已捕获）</p>
          <p className="text-red-200/90 break-words">{this.state.error.message}</p>
          <p className="text-[10px] text-red-400/70 mt-3">请打开控制台查看完整堆栈；若为酒馆 API 问题，请确认在酒馆助手 iframe 内打开。</p>
        </div>
      );
    }
    return this.props.children;
  }
}
