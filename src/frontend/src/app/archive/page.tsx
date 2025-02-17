"use client";
import Steps from "../components/Steps";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Retrieve the prompt from local storage when the component mounts
    const storedPrompt = localStorage.getItem("voiceAgentPrompt");
    if (storedPrompt) {
      setPrompt(storedPrompt);
    }
  }, []);

  const handleNextClick = () => {
    // Store the prompt in local storage
    localStorage.setItem("voiceAgentPrompt", prompt);
    // Navigate to the feedback page
    router.push("/feedback");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl" data-oid="g294.7a">
      {/* Title */}
      <h1
        className="text-4xl font-bold text-center text-black mb-8"
        data-oid="abn0rjp"
      >
        Optimise Voice Agents
      </h1>

      {/* Steps Component */}
      <Steps currentStep={1} data-oid="5fmd-g9" />

      {/* Input Card */}
      <div
        className="card bg-white shadow-md border border-gray-300 rounded-xl max-w-3xl mx-auto"
        data-oid="x5przkr"
      >
        <div className="card-body p-3" data-oid="qn4r5sj">
          <textarea
            className="textarea h-96 w-full resize-none bg-white text-black border-0 focus:outline-none focus:ring-0"
            placeholder="Paste your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-oid=":pmugz."
          />
        </div>
      </div>

      {/* Action Button */}
      <div
        className="flex justify-end mt-6 max-w-3xl mx-auto"
        data-oid="att-2sg"
      >
        <button
          className="btn btn-primary bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleNextClick}
          data-oid="ph_w.3r"
        >
          Next
        </button>
        <a href="/landing" className="ml-4" data-oid="7_16ck7">
          Go to Landing Page
        </a>
      </div>
    </div>
  );
}
