import React from "react";

interface StepsProps {
  currentStep: number;
}

const Steps: React.FC<StepsProps> = ({ currentStep }) => {
  return (
    <div
      className="flex items-center justify-center space-x-4 mb-10"
      data-oid="9888ddk"
    >
      {/* Step 1 */}
      <div className="flex items-center" data-oid="9y815ji">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
          data-oid="hl244z-"
        >
          1
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 1 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
          data-oid="cl1p5ff"
        >
          Upload Prompt
        </span>
      </div>
      {/* Connector Line */}
      <div
        className={`h-1 ${
          currentStep >= 2 ? "bg-blue-500" : "bg-gray-300"
        } w-16`}
        data-oid="ap_3l35"
      ></div>
      {/* Step 2 */}
      <div className="flex items-center" data-oid="nss.2_y">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
          data-oid="4p.wzne"
        >
          2
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 2 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
          data-oid="fyg2x:h"
        >
          Provide Feedback
        </span>
      </div>
      {/* Connector Line */}
      <div
        className={`h-1 ${
          currentStep >= 3 ? "bg-blue-500" : "bg-gray-300"
        } w-16`}
        data-oid=":4ojfas"
      ></div>
      {/* Step 3 */}
      <div className="flex items-center" data-oid="hh:9ubo">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          } text-sm font-semibold`}
          data-oid="3wqo8bd"
        >
          3
        </div>
        <span
          className={`ml-2 ${
            currentStep >= 3 ? "text-blue-500 font-medium" : "text-gray-500"
          } text-sm`}
          data-oid="apar-fd"
        >
          Improve Prompt
        </span>
      </div>
    </div>
  );
};

export default Steps;
