import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FitMind runtime error', error, info)
  }

  resetApp = () => {
    localStorage.removeItem('fitmind.session')
    window.location.href = '/auth'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fallback-screen">
        <section className="fallback-panel">
          <div className="brand auth-brand">
            <div className="brand-mark">FM</div>
            <div>
              <strong>FitMind AI</strong>
              <span>приложение остановилось при загрузке</span>
            </div>
          </div>
          <h1>Нужно перезапустить сессию</h1>
          <p>{this.state.error.message || 'Неизвестная ошибка интерфейса.'}</p>
          <button className="primary-button" type="button" onClick={this.resetApp}>
            Сбросить вход и открыть заново
          </button>
        </section>
      </main>
    )
  }
}
