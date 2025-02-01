"use client";
import { useState, useEffect } from "react";
import Steps from "../../components/Steps";
import { useRouter } from "next/navigation";

interface Change {
  sectionToEdit: string;
  howToEdit: string;
}

interface Problem {
  sectionToEdit: string;
  whyToEdit: string;
}

export default function Results() {
  const [prompt, setPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedPrompt = localStorage.getItem("voiceAgentPrompt");
    const storedChanges = localStorage.getItem("solutionList");
    const storedProblems = localStorage.getItem("problemList");
    if (storedPrompt) {
      setPrompt(storedPrompt);
    }
    if (storedChanges) {
      try {
        setChanges(JSON.parse(storedChanges));
      } catch (e) {
        console.error("Failed to parse changes:", e);
      }
    }
    if (storedProblems) {
      try {
        setProblems(JSON.parse(storedProblems));
      } catch (e) {
        console.error("Failed to parse problems:", e);
      }
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const restartProcess = () => {
    // clear local storage
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-6">
        Optimize Voice Agents
      </h1>

      <Steps currentStep={3} />

      <div className="mt-8">
        <h2 className="text-xl text-gray-700 mb-4">Results</h2>

        <div className="bg-gray-100 rounded-lg p-3">
          <div className="bg-white rounded px-9 py-7 shadow-inner font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto mb-3">
            {prompt}
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full justify-center"
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="collapse bg-white mt-4">
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium flex items-center gap-2">
            <svg
              className="w-5 h-5 collapse-plus"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <svg
              className="w-5 h-5 collapse-minus hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
            ChangeLog
          </div>
          <div className="collapse-content">
            <ul className="list-disc pl-5 space-y-2">
              {changes.map((change, index) => (
                <li key={index} className="text-gray-700">
                  <span className="font-semibold">{change.sectionToEdit}</span>:{" "}
                  {change.howToEdit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="collapse bg-white mt-4">
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium flex items-center gap-2">
            <svg
              className="w-5 h-5 collapse-plus"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <svg
              className="w-5 h-5 collapse-minus hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
            ProblemLog
          </div>
          <div className="collapse-content">
            <ul className="list-disc pl-5 space-y-2">
              {problems.map((problem, index) => (
                <li key={index} className="text-gray-700">
                  <span className="font-semibold">{problem.sectionToEdit}</span>
                  : {problem.whyToEdit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={restartProcess}
          className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Start New Optimization
        </button>
      </div>
    </div>
  );
}
