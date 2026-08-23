import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', border: '5px solid #ef4444', borderRadius: '8px', zIndex: 999999, position: 'relative', margin: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Oops! Application Crashed 🚨</h2>
                    <p style={{ marginTop: '10px' }}>Please take a screenshot of this error and send it to the developer:</p>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '15px', background: '#f87171', color: 'white', padding: '10px', borderRadius: '4px' }} open>
                        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Error Details</summary>
                        <strong>{this.state.error && this.state.error.toString()}</strong>
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
