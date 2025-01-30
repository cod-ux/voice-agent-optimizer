"use client";
import Steps from "../../components/Steps";

export default function Results() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center text-black mb-8">
        Optimise Voice Agents
      </h1>

      {/* Steps Component */}
      <Steps currentStep={3} />

      {/* Empty content area */}
      <div className="max-w-3xl mx-auto">
        {/* Content will be added later */}
      </div>
    </div>
  );
}
