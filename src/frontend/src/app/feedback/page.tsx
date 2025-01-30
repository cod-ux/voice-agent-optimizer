"use client";
import Steps from "../../components/Steps";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Retrieve the feedback from local storage when the component mounts
    const storedFeedback = localStorage.getItem("feedback");
    if (storedFeedback) {
      setFeedback(storedFeedback);
    }
  }, []);

  const handleNext = () => {
    // Save feedback to localStorage before navigating
    localStorage.setItem("feedback", feedback);
    router.push("/results");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center text-black mb-8">
        Optimise Voice Agents
      </h1>

      {/* Steps Component */}
      <Steps currentStep={2} />

      {/* Feedback Card */}
      <div className="card bg-white shadow-md border border-gray-300 rounded-xl max-w-3xl mx-auto mb-6">
        <div className="card-body p-3">
          <h2 className="text-lg font-semibold mb-2">Your Feedback</h2>
          <textarea
            className="textarea h-48 w-full resize-none bg-white text-black border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 max-w-3xl mx-auto">
        <button
          className="btn btn-primary bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => router.push("/")}
        >
          Back
        </button>
        <button
          className="btn btn-primary bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
