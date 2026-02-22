'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary
 * Catches errors in route segments and displays a recovery UI
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error
    console.error('Route error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] flex items-center justify-center">
      <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h2>

          <p className="text-white/70 mb-6">
            We encountered an error while loading this page. Please try again.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-red-400 text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
