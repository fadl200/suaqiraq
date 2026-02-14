import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  componentDidCatch(err: unknown, info: React.ErrorInfo) {
    // Keep console error for debugging
    // eslint-disable-next-line no-console
    console.error('App crashed:', err, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 w-full max-w-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">صار خطأ بالتطبيق</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 break-words">{this.state.message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              إعادة تحميل
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' })
              }}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              محاولة
            </button>
          </div>
        </div>
      </div>
    )
  }
}
