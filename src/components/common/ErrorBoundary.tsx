import React, { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  fallback?: ReactNode;
  children?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(): void {
    // Aquí podrías reportar el error a un servicio de logging si se requiere
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4">
          <h2 className="text-lg font-semibold text-red-600">Ha ocurrido un error.</h2>
          <p className="text-sm text-gray-600">Intenta recargar la página.</p>
        </div>
      );
    }
    return this.props.children as ReactNode;
  }
}
