"use client";
import { useState, useEffect, useCallback } from "react";
import Steps from "../../components/Steps";
import TerminalLog, { LogMessage } from "../../components/TerminalLog";
import { useRouter } from "next/navigation";

interface ChangeItem {
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

    const applyChanges = async (changeList: ChangeItem[]) => {
      console.log("[Apply Changes] Starting with:", {
        totalChanges: changeList.length,
        changes: changeList.map((c: ChangeItem) => ({
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
            addMessage(
              `Failed to apply changes to section: ${change.sectionToEdit} - ${
                result.error || "Unknown error"
              }`,
              "error"
            );
            throw new Error(result.error || "Failed to apply change");
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
        const storedPrompt = localStorage.getItem("voiceAgentPrompt");
        const feedback = localStorage.getItem("feedback");
        console.log("[Optimize] Retrieved stored data:", {
          hasPrompt: !!storedPrompt,
          promptLength: storedPrompt?.length,
          hasFeedback: !!feedback,
          feedbackLength: feedback?.length,
        });

        if (!mounted) return;

        if (!storedPrompt || !feedback) {
          console.error("[Optimize] Missing required data:", {
            hasPrompt: !!storedPrompt,
            hasFeedback: !!feedback,
          });
          addMessage("Error: Missing prompt or feedback data", "error");
          return;
        }

        // Step 1: Create Index Tree
        const newIndexTree = await createIndexTree(storedPrompt, feedback);

        console.log("New Index Tree:\n", newIndexTree);

        // Step 2: Create Change List
        if (mounted && newIndexTree) {
          const changeList = await createChangeList(
            storedPrompt,
            newIndexTree,
            feedback
          );

          // Step 3: Apply Changes
          if (mounted && changeList) {
            await applyChanges(changeList);
          }
        }
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
