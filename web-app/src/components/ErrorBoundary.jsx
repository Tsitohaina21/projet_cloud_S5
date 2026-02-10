import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Une erreur est survenue</h1>
          <p style={{ color: '#444', marginBottom: '12px' }}>
            Ouvre la console pour plus de details. Voici le message:
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>
            {String(this.state.error || '')}
          </pre>
          {this.state.errorInfo?.componentStack && (
            <pre style={{ whiteSpace: 'pre-wrap', color: '#555' }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
