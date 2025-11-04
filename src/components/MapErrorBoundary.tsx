import React from 'react';

interface MapErrorBoundaryProps {
  children: React.ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class MapErrorBoundary extends React.Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log detailed info for debugging without crashing the whole page
    console.error('[MapErrorBoundary] Map crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
          Map failed to load. Please try again later.
        </div>
      );
    }
    return this.props.children;
  }
}

export default MapErrorBoundary;
