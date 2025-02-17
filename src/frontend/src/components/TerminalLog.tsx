import React from "react";

export interface LogMessage {
  timestamp: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

interface TerminalLogProps {
  messages: LogMessage[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ messages }) => {
  const getMessageColor = (type: LogMessage["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div
      className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto"
      data-oid="qupimzl"
    >
      <div className="flex items-center gap-2 mb-3" data-oid="ryeah2w">
        <div
          className="h-3 w-3 rounded-full bg-red-500"
          data-oid="14rbh.n"
        ></div>
        <div
          className="h-3 w-3 rounded-full bg-yellow-500"
          data-oid="k:r0ofc"
        ></div>
        <div
          className="h-3 w-3 rounded-full bg-green-500"
          data-oid="chnx82g"
        ></div>
      </div>
      <div className="space-y-2" data-oid="jo9oayi">
        {messages.map((msg, index) => (
          <div key={index} className="flex" data-oid="jsw-u:s">
            <span className="text-gray-500 mr-2" data-oid="8-ya1gb">
              [{msg.timestamp}]
            </span>
            <span className={getMessageColor(msg.type)} data-oid="cle5_gs">
              {msg.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalLog;
