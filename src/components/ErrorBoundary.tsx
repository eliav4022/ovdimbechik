import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-red-50 to-slate-50 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-4">אופס! משהו השתבש</h2>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              נתקלנו בשגיאה לא צפויה בעת טעינת החלק הזה באתר. אל דאגה, אנחנו כבר מטפלים בזה.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleReset}
                className="w-full h-14 rounded-2xl gap-2 text-lg"
              >
                <RefreshCcw size={20} />
                נסו שוב
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="w-full h-14 rounded-2xl gap-2 text-slate-500"
              >
                <Home size={20} />
                חזרה לדף הבית
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-xs text-red-600 font-mono">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
