"use client";
import { useState, useEffect, useCallback } from "react";
import Steps from "../../components/Steps";
import TerminalLog, { LogMessage } from "../../components/TerminalLog";
import { useRouter } from "next/navigation";
import {
  validatePrompt,
  validateFeedback,
  validateIndexTree,
  validateProblemList,
  validateSolutionList,
} from "../../utils/validation";

interface ProblemItem {
  sectionToEdit: string;
}

interface SolutionItem {
  sectionToEdit: string;
  changeInstructions: string;
}

// Backend API configuration
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function Results() {
  const router = useRouter();
  const [messages, setMessages] = useState<LogMessage[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      message: "Waiting for approval to start optimization process...",
      type: "info",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const navigateToResults = useCallback(() => {
    router.push("/results");
  }, [router]);

  const navigateWithDelay = useCallback(
    (delayMs: number) => {
      setTimeout(navigateToResults, delayMs);
    },
    [navigateToResults]
  );

  const addMessage = (
    message: string,
    type: "info" | "success" | "error" | "warning" = "info"
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  };

  useEffect(() => {
    if (!isStarted) return;

    let mounted = true;

    const createIndexTree = async (prompt: string, feedback: string) => {
      addMessage("Starting index tree creation...", "info");
      addMessage(`Processing prompt: ${prompt.substring(0, 50)}...`, "info");
      console.log("[Index Tree] Starting creation with:", {
        promptLength: prompt.length,
        feedbackLength: feedback.length,
      });

      const response = await fetch(`${BACKEND_URL}/api/create-index-tree`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          feedback,
        }),
      });

      const result = await response.json();
      console.log("[Index Tree] API response:", {
        success: result.success,
        error: result.error,
        dataLength: result.data?.indexTree?.length,
      });

      if (!result.success) {
        console.error("[Index Tree] Creation failed:", result.error);
        throw new Error(result.error || "Failed to create index tree");
      }

      const newIndexTree = result.data.indexTree;
      localStorage.setItem("indexTree", newIndexTree);
      addMessage("Successfully created index tree!", "success");

      return newIndexTree;
    };

    const createProblemList = async (
      prompt: string,
      indexTree: string,
      feedback: string
    ): Promise<ProblemItem[]> => {
      addMessage("Starting to create problem list...", "info");
      console.log("[Problem List] Starting creation with:", {
        promptLength: prompt.length,
        indexTreeLength: indexTree.length,
        feedbackLength: feedback.length,
      });

      const response = await fetch(`${BACKEND_URL}/api/create-problem-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          indexTree,
          feedback,
        }),
      });

      const result = await response.json();
      console.log("[Problem List] API response:", {
        success: result.success,
        error: result.error,
        dataLength: result.data?.planToEdit?.length,
      });

      if (!result.success) {
        console.error("[Problem List] Creation failed:", result.error);
        throw new Error(result.error || "Failed to create problem list");
      }

      // parse planToEdit
      const { planToEdit } = result.data;
      console.log("[Problem List] API returned:", {
        planLength: planToEdit?.length,
        planType: typeof planToEdit,
        plan: planToEdit,
      });

      // The plan is already an object, no need to parse it
      const problemListArray = Array.isArray(planToEdit) ? planToEdit : [];

      if (!problemListArray.length) {
        console.error(
          "[Problem List] Invalid or empty problem list:",
          planToEdit
        );
        throw new Error("Failed to get valid plan");
      }

      localStorage.setItem("problemList", JSON.stringify(problemListArray));
      addMessage("Successfully created problem list!", "success");

      return problemListArray;
    };

    const createSolutionList = async (
      problemList: ProblemItem[],
      prompt: string,
      feedback: string
    ): Promise<SolutionItem[]> => {
      addMessage("Starting to create solution list...", "info");
      console.log("[Solution List] Starting creation with:", {
        problemListLength: problemList.length,
        promptLength: prompt.length,
        feedbackLength: feedback.length,
      });

      // parse problem list

      const response = await fetch(`${BACKEND_URL}/api/create-solution-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: problemList,
          prompt,
          feedback,
        }),
      });

      const result = await response.json();
      console.log("[Solution List] API response:", {
        success: result.success,
        error: result.error,
        dataLength: result.data.planToChange.length,
      });

      if (!result.success) {
        console.error("[Solution List] Creation failed:", result.error);
        throw new Error(result.error || "Failed to create solution list");
        addMessage("Failed to create solution list!", "error");
      }

      const { planToChange } = result.data;
      console.log("[Solution List] API returned:", {
        planLength: planToChange?.length,
        planType: typeof planToChange,
        plan: planToChange,
      });

      if (
        !planToChange ||
        !Array.isArray(planToChange) ||
        !planToChange.length
      ) {
        console.error(
          "[Solution List] Invalid or empty solution plan:",
          planToChange
        );
        throw new Error("Failed to get valid solution plan");
      }

      localStorage.setItem("solutionList", JSON.stringify(planToChange));
      addMessage("Successfully created solution list!", "success");

      return planToChange;
    };
    /*
    const createChangeList = async (
      prompt: string,
      indexTree: string,
      feedback: string
    ): Promise<ChangeItem[]> => {
      addMessage("Starting to create change list...", "info");
      console.log("[Change List] Starting creation with:", {
        promptLength: prompt.length,
        indexTreeLength: indexTree.length,
        feedbackLength: feedback.length,
      });

      const response = await fetch(`${BACKEND_URL}/api/create-change-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          indexTree,
          feedback,
        }),
      });

      const result = await response.json();
      console.log("[Change List] API response:", {
        success: result.success,
        error: result.error,
        hasChangeList: !!result.data?.changeList,
      });

      if (!result.success) {
        console.error("[Change List] Creation failed:", result.error);
        throw new Error(result.error || "Failed to create change list");
      }

      const { changeList } = result.data;
      console.log("[Change List] Raw response:", changeList);
      console.log("[Change List] Response type:", typeof changeList);
      try {
        const changeListObj = JSON.parse(changeList);
        console.log("[Change List] Successfully parsed JSON:", changeListObj);
        const changeListArray = changeListObj.changeListArray;

        console.log("[Change List] Parsed result:", {
          numberOfChanges: changeListArray.length,
          changes: changeListArray.map((c: ChangeItem) => ({
            section: c.sectionToEdit,
            instructionLength: c.changeInstructions.length,
          })),
        });

        localStorage.setItem("changeList", JSON.stringify(changeListArray));
        addMessage("Successfully created change list!", "success");

        return changeListArray;
      } catch (error) {
        console.error("[Change List] Failed to parse JSON:", error);
        throw new Error("Failed to parse change list JSON");
      }
    };
*/
    const applyChanges = async (changeList: SolutionItem[]) => {
      console.log("[Apply Changes] Starting with:", {
        totalChanges: changeList.length,
        changes: changeList.map((c: SolutionItem) => ({
          section: c.sectionToEdit,
          instructionLength: c.changeInstructions.length,
        })),
      });

      addMessage(`Starting to apply ${changeList.length} changes...`, "info");

      for (const change of changeList) {
        try {
          addMessage(
            `Applying changes to section: ${change.sectionToEdit}...`,
            "info"
          );

          addMessage(`How to edit: ${change.changeInstructions}`, "info");

          const response = await fetch(`${BACKEND_URL}/api/apply-changes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              change,
              currentPrompt: localStorage.getItem("voiceAgentPrompt") || "",
              currentIndexTree: localStorage.getItem("indexTree") || "",
            }),
          });

          console.log("[Apply Changes] Response status:", response.status);
          const contentType = response.headers.get("content-type");
          console.log("[Apply Changes] Response content-type:", contentType);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[Apply Changes] Error response:", errorText);
            addMessage(
              `Failed to apply changes to section: ${change.sectionToEdit}`,
              "error"
            );
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }

          if (!contentType?.includes("application/json")) {
            const text = await response.text();
            console.error("[Apply Changes] Non-JSON response:", text);
            addMessage(
              `Server returned invalid response format for section: ${change.sectionToEdit}`,
              "error"
            );
            throw new Error("Server returned non-JSON response");
          }

          const result = await response.json();
          console.log("[Apply Changes] Successfully processed change:", {
            section: change.sectionToEdit,
            success: result.success,
          });

          if (!result.success) {
            const errorMsg = `Failed to apply changes to section: ${change.sectionToEdit} - ${
              result.error || "Unknown error"
            }`;
            console.error("[Apply Changes] Error:", {
              section: change.sectionToEdit,
              error: result.error,
            });
            addMessage(errorMsg, "error");
            return; // Don't throw, just return to allow the message to be shown
          }

          addMessage(
            `Successfully applied changes to section: ${change.sectionToEdit}`,
            "success"
          );

          // Update local storage with the new prompt and index tree
          if (result.data) {
            localStorage.setItem("voiceAgentPrompt", result.data.updatedPrompt);
            localStorage.setItem("indexTree", result.data.updatedIndexTree);
          }
        } catch (error) {
          console.error("[Apply Changes] Error processing change:", {
            section: change.sectionToEdit,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }

      addMessage("Successfully applied all changes!", "success");
      addMessage(
        "Voice Agent has been optimized! Redirecting to results...",
        "success"
      );
      navigateWithDelay(1000); // 1 second delay before redirecting
    };

    const optimizeAgent = async () => {
      console.log("[Optimize] Starting optimization process");
      setIsProcessing(true);

      try {
        const storedPrompt = localStorage.getItem("voiceAgentPrompt") || "";
        const feedback = localStorage.getItem("feedback") || "";

        if (!validatePrompt(storedPrompt)) {
          throw new Error("Invalid or empty prompt");
        }
        if (!validateFeedback(feedback)) {
          throw new Error("Invalid or empty feedback");
        }

        // Step 1: Create Index Tree
        const newIndexTree = await createIndexTree(storedPrompt, feedback);
        if (!validateIndexTree(newIndexTree)) {
          throw new Error("Invalid index tree format");
        }

        console.log("Index Tree created:", newIndexTree);

        // Step 2: Create Problem List
        const newProblemList = await createProblemList(
          storedPrompt,
          newIndexTree,
          feedback
        );
        if (!validateProblemList(newProblemList)) {
          throw new Error("Invalid problem list format");
        }

        // Step 3: Create Solution List

        console.log("Problem List check:", newProblemList);
        console.log("Prompt check:", storedPrompt);
        console.log("Feedback check:", feedback);

        const newSolutionList = await createSolutionList(
          newProblemList,
          storedPrompt,
          feedback
        );
        if (!validateSolutionList(newSolutionList)) {
          throw new Error("Invalid solution list format");
        }

        // Step 4: Apply Changes
        await applyChanges(newSolutionList);
      } catch (error) {
        console.error("[Optimize] Error in process:", error);
        if (mounted) {
          addMessage(
            `Error in optimization process: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            "error"
          );
        }
      } finally {
        if (mounted) {
          console.log("[Optimize] Process completed");
          setIsProcessing(false);
        }
      }
    };

    // Add 500ms delay before starting
    const timer = setTimeout(() => {
      optimizeAgent();
    }, 500);

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isStarted, navigateToResults, navigateWithDelay]); // Run when isStarted changes

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center text-black mb-8">
        Optimise Voice Agents
      </h1>

      {/* Steps Component */}
      <Steps currentStep={3} />

      {/* Terminal Component */}
      <div className="my-8">
        <TerminalLog messages={messages} />
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-8">
        <a href="/feedback" className="btn btn-outline">
          Back to Feedback
        </a>

        <button
          onClick={() => setIsStarted(true)}
          disabled={isProcessing || isStarted}
          className={`btn ${
            isProcessing || isStarted ? "btn-disabled" : "btn-primary"
          }`}
        >
          {isProcessing ? "Processing..." : "Start Optimization"}
        </button>
      </div>
    </div>
  );
}
