import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
};

const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'md',
    className = '',
}) => {
    return (
        <div className={`flex flex-col justify-center items-center py-20 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} text-brand-600 animate-spin`} />
            {message && <p className="text-gray-500 mt-4 text-sm">{message}</p>}
        </div>
    );
};

export default LoadingState;
