import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    type?: 'default' | 'danger' | 'success';
}

export function Modal({ isOpen, onClose, title, children, actions, type = 'default' }: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div
                ref={dialogRef}
                className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 ring-1 ring-black/5"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${type === 'danger' ? 'bg-red-50' : type === 'success' ? 'bg-green-50' : 'bg-white'
                    }`}>
                    <h3 className={`font-semibold text-lg ${type === 'danger' ? 'text-red-700' : type === 'success' ? 'text-green-700' : 'text-gray-900'
                        }`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-md hover:bg-black/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 text-gray-600 text-sm leading-relaxed max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {actions && (
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
