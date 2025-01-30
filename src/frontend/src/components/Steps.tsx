import React from "react";

interface StepsProps {
  currentStep: number;
}

const Steps: React.FC<StepsProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-10">
      {/* Step 1 */}
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
        >
          1
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 1 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
        >
          Upload Prompt
        </span>
      </div>
      {/* Connector Line */}
      <div
        className={`h-1 ${
          currentStep >= 2 ? "bg-blue-500" : "bg-gray-300"
        } w-16`}
      ></div>
      {/* Step 2 */}
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
        >
          2
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 2 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
        >
          Provide Feedback
        </span>
      </div>
      {/* Connector Line */}
      <div
        className={`h-1 ${
          currentStep >= 3 ? "bg-blue-500" : "bg-gray-300"
        } w-16`}
      ></div>
      {/* Step 3 */}
      <div className="flex items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
        >
          3
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 3 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
        >
          Improve Prompt
        </span>
      </div>
    </div>
  );
};

export default Steps;
