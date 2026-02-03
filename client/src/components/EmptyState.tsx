import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = Inbox,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
}) => {
    return (
        <div
            className={`text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 ${className}`}
        >
            <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && <p className="text-gray-500 mt-1">{description}</p>}
            {actionLabel && onAction && (
                <Button className="mt-4" size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
