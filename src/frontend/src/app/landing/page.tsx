"use client";

import { useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";

// Custom theme for the diff viewer
const diffViewerTheme = {
  variables: {
    light: {
      diffViewerBackground: "#f8f9fa",
      diffViewerColor: "#212529",
      addedBackground: "#e6ffec",
      addedColor: "#24292f",
      removedBackground: "#ffebe9",
      removedColor: "#24292f",
      wordAddedBackground: "#abf2bc",
      wordRemovedBackground: "#fdb8c0",
    },
  },
  diffContainer: {
    maxHeight: "400px",
    overflow: "auto",
    fontSize: "13px",
  },
  splitView: {
    padding: "5px 10px",
  },
  line: {
    padding: "2px 0",
  },
  lineNumber: {
    padding: "0 5px",
    minWidth: "30px",
    fontSize: "12px",
  },
  titleBlock: {
    padding: "10px",
    background: "#f1f3f4",
    borderBottom: "1px solid #ddd",
  },
};

interface LogMessage {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface Problem {
  sectionToEdit: string;
}

interface Solution {
  sectionToEdit: string;
  changeInstructions: string;
}

// Backend API configuration
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function LandingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const addMessage = (message: string, type: LogMessage["type"] = "info") => {
    setMessages((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newPrompt);
      addMessage("Copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      addMessage("Failed to copy to clipboard", "error");
    }
  };

  const createIndexTree = async (prompt: string, feedback: string) => {
    addMessage("Creating index tree...", "info");
    const response = await fetch(`${BACKEND_URL}/api/create-index-tree`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, feedback }),
      signal: abortController?.signal,
    });

    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Failed to create index tree");

    return result.data.indexTree;
  };

  const createProblemList = async (
    indexTree: string,
    prompt: string,
    feedback: string
  ) => {
    addMessage("Analyzing problems...", "info");
    console.log("[createProblemList] Starting with:", {
      indexTreeLength: indexTree?.length,
      promptLength: prompt?.length,
      feedbackLength: feedback?.length,
    });

    try {
      if (!indexTree) throw new Error("Index tree is undefined");
      if (!prompt) throw new Error("Prompt is undefined");
      if (!feedback) throw new Error("Feedback is undefined");

      const response = await fetch(`${BACKEND_URL}/api/create-problem-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indexTree, prompt, feedback }),
        signal: abortController?.signal,
      });

      if (!response.ok) {
        console.error("[createProblemList] API response not ok:", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("[createProblemList] API response:", result);

      if (!result.success) {
        console.error("[createProblemList] API error:", result.error);
        throw new Error(result.error || "Failed to create problem list");
      }

      if (!result.data?.planToEdit) {
        console.error(
          "[createProblemList] Missing planToEdit in response:",
          result
        );
        throw new Error("Invalid response: Missing planToEdit");
      }

      console.log(
        "[createProblemList] Success, problems:",
        result.data.planToEdit
      );
      return result.data.planToEdit;
    } catch (error) {
      console.error("[createProblemList] Error:", error);
      throw error;
    }
  };

  const createSolutionList = async (
    problemList: Problem[],
    prompt: string,
    feedback: string
  ) => {
    addMessage("Generating solutions...", "info");
    console.log("[createSolutionList] Starting with:", {
      planLength: problemList.length,
      promptLength: prompt.length,
      feedbackLength: feedback.length,
    });

    try {
      const response = await fetch(`${BACKEND_URL}/api/create-solution-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: problemList, prompt, feedback }),
        signal: abortController?.signal,
      });

      const result = await response.json();
      console.log("[createSolutionList] API response:", result);

      if (!result.success) {
        console.error("[createSolutionList] API error:", result.error);
        throw new Error(result.error || "Failed to create solution list");
      }

      if (!result.data?.planToChange) {
        console.error(
          "[createSolutionList] Missing planToChange in response:",
          result
        );
        throw new Error("Invalid response: Missing planToChange");
      }

      console.log(
        "[createSolutionList] Success, solutions:",
        result.data.planToChange
      );
      return result.data.planToChange;
    } catch (error) {
      console.error("[createSolutionList] Error:", error);
      throw error;
    }
  };

  const applyChanges = async (
    solution: Solution,
    prompt: string,
    indexTree: string
  ) => {
    addMessage(`Applying Change: ${solution.sectionToEdit}`, "info");
    const response = await fetch(`${BACKEND_URL}/api/apply-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        change: solution,
        currentPrompt: prompt,
        currentIndexTree: indexTree,
      }),
      signal: abortController?.signal,
    });

    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Failed to apply changes");

    return result.data;
  };

  const handleModify = async () => {
    setIsProcessing(true);
    setHasResults(false);
    setMessages([]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      console.log("[handleModify] Starting modification process");

      // Step 1: Create index tree
      console.log("[handleModify] Creating index tree...");
      const indexTree = await createIndexTree(currentPrompt, feedback);
      console.log("[handleModify] Index tree created:", {
        indexTreeLength: indexTree.length,
      });
      addMessage("Index tree created successfully", "success");

      // Step 2: Create problem list
      console.log("[handleModify] Creating problem list...");
      const problemList = await createProblemList(
        indexTree,
        currentPrompt,
        feedback
      );
      console.log("[handleModify] Problem list created:", {
        problemCount: problemList.length,
        problems: problemList,
      });
      addMessage(`Found ${problemList.length} issues to address`, "info");

      // Step 3: Create solution list
      console.log("[handleModify] Creating solution list...");
      const solutionList = await createSolutionList(
        problemList,
        currentPrompt,
        feedback
      );
      console.log("[handleModify] Solution list created:", {
        solutionCount: solutionList?.length,
        solutions: solutionList,
      });
      addMessage("Generated solutions for all issues", "success");

      // Step 4: Apply changes
      console.log("[handleModify] Applying changes...");
      let currentPromptVersion = currentPrompt;
      let currentIndexTreeVersion = indexTree;

      addMessage("Applying changes...", "info");

      for (const solution of solutionList) {
        // Log the section being edited

        const result = await applyChanges(
          solution,
          currentPromptVersion,
          currentIndexTreeVersion
        );
        currentPromptVersion = result.updatedPrompt;
        currentIndexTreeVersion =
          result.updatedIndexTree || currentIndexTreeVersion;
      }

      setNewPrompt(currentPromptVersion);
      setChanges(solutionList.map((s: Solution) => s.changeInstructions));
      setHasResults(true);
      addMessage("Successfully updated the prompt!", "success");
    } catch (error) {
      if (error instanceof Error) {
        addMessage(error.message, "error");
      } else {
        addMessage("An unexpected error occurred", "error");
      }
      console.error("Error in modification process:", error);
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsProcessing(false);
    setHasResults(false);
    setNewPrompt("");
    setChanges([]);
    addMessage("Operation cancelled", "warning");
  };

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-4xl">🐰</div>
        <h1 className="text-3xl font-bold">Debug Bunny</h1>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Step 1: Input */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <h2 className="text-2xl font-bold">Input Feedback & Prompt</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="font-medium mb-2 block">Current Prompt</label>
                <textarea
                  className="textarea textarea-bordered w-full h-40"
                  placeholder="Paste the current prompt..."
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="font-medium mb-2 block">Feedback</label>
                <textarea
                  className="textarea textarea-bordered w-full h-40"
                  placeholder="Enter feedback about the AI agent..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="btn btn-primary"
                onClick={handleModify}
                disabled={!feedback.trim() || !currentPrompt.trim()}
              >
                Modify Agent
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Analysis */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <h2 className="text-2xl font-bold">Analyzing & Fixing</h2>
            </div>

            <div className="bg-primary/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
              {isProcessing && (
                <div className="flex items-center gap-4">
                  <div className="loading loading-spinner loading-md text-primary"></div>
                  <p className="text-primary text-lg">Magic in progress...</p>
                </div>
              )}
              {messages.length > 0 && (
                <div className="w-full max-h-48 overflow-y-auto mt-4 space-y-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`text-sm flex items-start gap-2 ${
                        msg.type === "error"
                          ? "text-error"
                          : msg.type === "success"
                          ? "text-success"
                          : msg.type === "warning"
                          ? "text-warning"
                          : "text-primary"
                      }`}
                    >
                      <span className="opacity-50 text-xs">
                        {msg.timestamp}
                      </span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
              )}
              {isProcessing && (
                <button
                  className="btn btn-ghost btn-sm mt-4"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
            {!isProcessing && !messages.length && (
              <div className="bg-base-200 rounded-xl p-8 flex items-center justify-center">
                <p className="text-base-content/70">
                  Click &apos;Modify Agent&apos; to start the process
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Results */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <h2 className="text-2xl font-bold">Results</h2>
              </div>
              {hasResults && (
                <button className="btn btn-primary gap-2" onClick={handleCopy}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy New Prompt
                </button>
              )}
            </div>

            {hasResults ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-500">
                      Original Prompt
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      Modified Prompt
                    </div>
                  </div>
                  <div
                    className="relative"
                    style={{ height: "400px", overflow: "auto" }}
                  >
                    <ReactDiffViewer
                      oldValue={currentPrompt}
                      newValue={newPrompt}
                      splitView={true}
                      useDarkTheme={false}
                      hideLineNumbers={false}
                      showDiffOnly={false}
                      styles={diffViewerTheme}
                      extraLinesSurroundingDiff={3}
                      codeFoldMessageRenderer={() => <span></span>}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Summary of Changes:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {changes.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-base-content/70 text-center py-4">
                Results will appear here after processing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
