import React from 'react';

export interface LogMessage {
  timestamp: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

interface TerminalLogProps {
  messages: LogMessage[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ messages }) => {
  const getMessageColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full bg-red-500"></div>
        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
        <div className="h-3 w-3 rounded-full bg-green-500"></div>
      </div>
      <div className="space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="flex">
            <span className="text-gray-500 mr-2">[{msg.timestamp}]</span>
            <span className={getMessageColor(msg.type)}>{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalLog;
