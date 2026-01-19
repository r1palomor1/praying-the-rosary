import { useState, useEffect } from 'react';
import { Copy, X, Trash2 } from 'lucide-react';
import './DebugPanel.css';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'log' | 'error' | 'warn';
}

export function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        // Intercept console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args: any[]) => {
            originalLog(...args);
            addLog('log', args.join(' '));
        };

        console.error = (...args: any[]) => {
            originalError(...args);
            addLog('error', args.join(' '));
        };

        console.warn = (...args: any[]) => {
            originalWarn(...args);
            addLog('warn', args.join(' '));
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    const addLog = (type: 'log' | 'error' | 'warn', message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const copyLogs = async () => {
        const text = logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    if (!isOpen) {
        return (
            <button className="debug-toggle" onClick={() => setIsOpen(true)}>
                Debug
            </button>
        );
    }

    return (
        <div className="debug-panel">
            <div className="debug-header">
                <h3>Debug Console</h3>
                <div className="debug-actions">
                    <button onClick={copyLogs} title="Copy logs">
                        <Copy size={16} />
                        {copySuccess && <span className="copy-success">✓</span>}
                    </button>
                    <button onClick={clearLogs} title="Clear logs">
                        <Trash2 size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} title="Close">
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="debug-logs">
                {logs.length === 0 ? (
                    <div className="debug-empty">No logs yet</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`debug-log debug-${log.type}`}>
                            <span className="debug-time">{log.timestamp}</span>
                            <span className="debug-message">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
