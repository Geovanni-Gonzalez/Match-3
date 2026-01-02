/**
 * @file ErrorBoundary.tsx
 * @description React Error Boundary para capturar errores de rendering
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '../utils/Logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component que captura errores en el árbol de componentes
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(_error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        Logger.error('[ErrorBoundary] Error capturado:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Usar fallback personalizado si se proporciona
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback por defecto
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '3rem',
                        maxWidth: '600px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</h1>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                            ¡Oops! Algo salió mal
                        </h2>
                        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
                            Ocurrió un error inesperado. Por favor, intenta recargar la página.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                marginBottom: '2rem',
                                textAlign: 'left',
                                background: 'rgba(0, 0, 0, 0.2)',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    Ver detalles del error
                                </summary>
                                <pre style={{ overflow: 'auto', margin: 0 }}>
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'white',
                                    color: '#667eea',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Volver al inicio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
