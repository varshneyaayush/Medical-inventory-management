import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
        error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
        info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
    };

    const borders = {
        success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
        error: 'border-rose-200 bg-rose-50/90 text-rose-900',
        warning: 'border-amber-200 bg-amber-50/90 text-amber-900',
        info: 'border-sky-200 bg-sky-50/90 text-sky-900'
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-xl backdrop-blur-md animate-bounce-short transition-all ${borders[type]}`}>
            {icons[type]}
            <p className="text-sm font-semibold">{message}</p>
            <button onClick={onClose} className="p-1 hover:opacity-75 transition-opacity ml-2">
                <X className="w-4 h-4 opacity-60" />
            </button>
        </div>
    );
}
