import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
    message?: string;
    title?: string;
    onRetry?: () => void;
    className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Something went wrong. Please try again.',
    title = 'Error',
    onRetry,
    className = '',
}) => {
    return (
        <div
            className={`text-center py-20 bg-white rounded-2xl border border-red-100 ${className}`}
        >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-red-600 mb-4">{message}</p>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            )}
        </div>
    );
};

export default ErrorState;
