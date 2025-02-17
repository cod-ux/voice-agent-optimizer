"use client";
import { useState, useEffect } from "react";
import Steps from "../../../components/Steps";
import { useRouter } from "next/navigation";

interface Change {
  sectionToEdit: string;
  changeInstructions: string;
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
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-oid="bjp-e7w">
      <h1 className="text-4xl font-bold text-center mb-6" data-oid="5z9--60">
        Optimize Voice Agents
      </h1>

      <Steps currentStep={3} data-oid="07tdc0x" />

      <div className="mt-8" data-oid="pkpdbez">
        <h2 className="text-xl text-gray-700 mb-4" data-oid="dsq_8h:">
          Results
        </h2>

        <div className="bg-gray-100 rounded-lg p-3" data-oid="c-d:ozi">
          <div
            className="bg-white rounded px-9 py-7 shadow-inner font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto mb-3"
            data-oid="cq5bgdl"
          >
            {prompt}
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full justify-center"
            data-oid="0v19s:3"
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="crey:4l"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                    data-oid="9a79p76"
                  />
                </svg>
                <span data-oid="6lppn1i">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="78gzqde"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    data-oid="dte6go9"
                  />
                </svg>
                <span data-oid="z7vuq4l">Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="collapse bg-white mt-4" data-oid="2nl_1qk">
          <input type="checkbox" data-oid="eroa9z5" />
          <div
            className="collapse-title text-xl font-medium flex items-center gap-2"
            data-oid="1ma:h73"
          >
            <svg
              className="w-5 h-5 collapse-plus"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-oid="tp8.z6z"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                data-oid="1.vsc2f"
              />
            </svg>
            <svg
              className="w-5 h-5 collapse-minus hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-oid="jmuj:04"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
                data-oid="ww._3f3"
              />
            </svg>
            ChangeLog
          </div>
          <div className="collapse-content" data-oid="g:965cd">
            <ul className="list-disc pl-5 space-y-2" data-oid="kbb3vyk">
              {changes.map((change, index) => (
                <li key={index} className="text-gray-700" data-oid="b_nmzou">
                  <span className="font-semibold" data-oid="ruz:ay_">
                    {change.sectionToEdit}
                  </span>
                  : {change.changeInstructions}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="collapse bg-white mt-4" data-oid="62y-juz">
          <input type="checkbox" data-oid="q1-z55_" />
          <div
            className="collapse-title text-xl font-medium flex items-center gap-2"
            data-oid="got6lnd"
          >
            <svg
              className="w-5 h-5 collapse-plus"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-oid="hro0qea"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                data-oid="dff-2pr"
              />
            </svg>
            <svg
              className="w-5 h-5 collapse-minus hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-oid="slilo0c"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
                data-oid="f1f1r7l"
              />
            </svg>
            ProblemLog
          </div>
          <div className="collapse-content" data-oid="ttd1vf3">
            <ul className="list-disc pl-5 space-y-2" data-oid="da2psgv">
              {problems.map((problem, index) => (
                <li key={index} className="text-gray-700" data-oid="0wygabf">
                  <span className="font-semibold" data-oid="oghlp2v">
                    {problem.sectionToEdit}
                  </span>
                  : {problem.whyToEdit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={restartProcess}
          className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          data-oid="nfcjc0b"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-oid=".td8h5z"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              data-oid="7b1lhy9"
            />
          </svg>
          Start New Optimization
        </button>
      </div>
    </div>
  );
}
