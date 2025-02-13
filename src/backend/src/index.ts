// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt

import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import OpenAI from "openai";
import "dotenv/config";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import express from "express";
import cors from "cors";

import {
  ApiResult,
  JsonNode,
  CreateIndexTreeRequest,
  CreateIndexTreeResponse,
  CreateChangeListRequest,
  CreateChangeListResponse,
  ApplyChangeRequest,
  ApplyChangeResponse,
  Change,
  ChangeResult,
  ApplyChangeResult
} from './types';

const app = express();

// Configure CORS options
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply middleware
app.use(express.json());
app.use(cors(corsOptions));

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

const PORT = process.env.PORT || 3001;

const feedbackFilePath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "inputs",
  "feedback.txt"
);
const ogPromptFilePath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "inputs",
  "ogPrompt.md"
);
const createIndexTreeFilePath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "prompts",
  "createIndexTree.md"
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;
const GROQ_KEY = process.env.GROQ_KEY;

const DS_client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: DEEPSEEK_API_KEY,
});

const GROQ_client = new OpenAI({
  apiKey: GROQ_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const changeItemSchema = z.object({
  sectionToEdit: z.string(),
  changeInstructions: z.string(),
});

const changeListSchema = z.object({
  changeListArray: z.array(changeItemSchema),
});

// function to add line numbers to ogPrompt
function addLineNumberToOgPrompt(ogPrompt: string) {
  // split ogPrompt into lines
  const lines = ogPrompt.split("\n");
  // add line number as 'line 1: ' to each line in ogPrompt
  const ogPromptWithLineNumbers = lines
    .map((line, i) => `line ${i + 1}: ${line}`)
    .join("\n");
  return ogPromptWithLineNumbers;
}

// function to create Index tree with line ranges
async function createIndexTree(feedback: string, ogPrompt: string) {
  try {
    console.log("[createIndexTree] Starting with inputs:", {
      feedbackLength: feedback.length,
      ogPromptLength: ogPrompt.length
    });
    console.log("Step 1: Adding line numbers to ogPrompt");
    // step 1: add line numbers to ogprompt

    // add line number as 'line 1: ' to each line in ogPrompt
    let ogPromptWithLineNumbers = addLineNumberToOgPrompt(ogPrompt);

    console.log(
      "Step 2: Sending to LLM to create hierarchical tree with line ranges"
    );
    // step 2: send to llm and make hierarchical tree with line ranges
    const createIndexTreePrompt = readFileSync(createIndexTreeFilePath, "utf-8");
    const filledCreateIndexTreePrompt = createIndexTreePrompt.replace(
      "{ogPrompt}",
      ogPromptWithLineNumbers
    );
    const indexTreeBuffer = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: filledCreateIndexTreePrompt }],
    });

    const indexTree = indexTreeBuffer.choices[0].message.content;

    console.log("Step 3: Saving indexTree to file");
    // step 3: create indexTree.md

    // check if its json format and then save it
    if (!indexTree) {
      throw new Error("Invalid response from LLM: Missing content.");
    }

    // extract json object between ```json and ``` characters
    const startIndex = indexTree.indexOf("```json") + "```json".length;
    const endIndex = indexTree.indexOf("```", startIndex);
    const indexTreeJsonString = indexTree.substring(startIndex, endIndex);

    // save the index tree to src/outputs
    let indexTreePath = path.join(__dirname, "..", "outputs", "indexTree.md");
    writeFileSync(indexTreePath, indexTreeJsonString);
    
    return indexTreeJsonString;
  } catch (error) {
    console.error("[createIndexTree] Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}

// function to send ogPrompt, indexTree and feedback to openai to ask it to return a list of changes to make
async function createChangeList(prompt: string, indexTree: string, feedback: string) {
  try {
    console.log("[createChangeList] Starting with inputs:", {
      promptLength: prompt.length,
      indexTreeLength: indexTree.length,
      feedbackLength: feedback.length
    });
    console.log("Step 1: Sending to LLM to create change log");

    const createChangeListPromptFilePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "prompts",
      "createChangeList.md"
    );
    const createChangeListPrompt = readFileSync(
      createChangeListPromptFilePath,
      "utf-8"
    );

    const filledCreateChangeListPrompt = createChangeListPrompt
      .replace("{indexTree}", indexTree)
      .replace("{feedback}", feedback)
      .replace("{ogPrompt}", prompt);

    const o1_response = await DS_client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: filledCreateChangeListPrompt }],
    });
    const changeListBuffer = await client.beta.chat.completions.parse({
      model: "gpt-4o",
      messages: [{ role: "user", content: `Given the following data, format it with the given response format: ${o1_response.choices[0].message.content}` }],
      response_format: zodResponseFormat(changeListSchema, "change_list"),
    });
    const changeList = changeListBuffer.choices[0].message.parsed;
    console.log("Step 2: Saving changeList to file");
    // step 2: create changeList.md
    if (!changeList) {
      throw new Error("Invalid response from LLM: Missing content.");
    }

    const changeListText = JSON.stringify(changeList, null, 2);
    let changeListPath = path.join(__dirname, "..", "outputs", "changeList.md");
    writeFileSync(changeListPath, changeListText);
    console.log("Step 3: Done");
    
    return changeListText;
  } catch (error) {
    console.error("[createChangeList] Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}

async function applyChanges(changeList: string, prompt: string, indexTree: string) {
  try {
    if (!changeList) {
      throw new Error("Invalid response from LLM: Missing content.");
    }

    console.log("[applyChanges] Attempting to parse changeList:", { 
      changeListLength: changeList.length,
      changeListPreview: changeList.substring(0, 100) + "..."
    });

    const changeListJson = JSON.parse(changeList);

    const applyChangesPromptFilePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "prompts",
      "applyChanges.md"
    );
    const applyChangesPrompt = readFileSync(applyChangesPromptFilePath, "utf-8");

    const changeListArray = changeListJson.changeListArray;

    let tempPromptContent = prompt;
    let tempIndexTree = indexTree;
    let successfulChangeCount = 0;

    const results = [];

    for (let i = 0; i < changeListArray.length; i++) {
      const change = changeListArray[i];
      const sectionToEdit = change.sectionToEdit;
      const changeInstructions = change.changeInstructions;

      console.log(
        `Processing change ${i + 1} of ${
          changeListArray.length
        } - Section: ${sectionToEdit}`
      );

      let tempIndexTreeJson = JSON.parse(tempIndexTree);

      const ogSectionRange: { start: number; end: number } | null = findLineRange(
        tempIndexTreeJson,
        sectionToEdit
      );
      try {
        if (!ogSectionRange) {
          throw new Error("Invalid section name: " + sectionToEdit);
        }
      } catch (error) {
        console.error(`Error in applyChanges: ${error}`);
        results.push({
          section: sectionToEdit,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }

      console.log(
        `Section ${sectionToEdit} found at line range ${ogSectionRange.start}-${ogSectionRange.end}`
      );

      const tempPromptLines = tempPromptContent.split("\n");
      const lineRangeArray = tempPromptLines.slice(
        ogSectionRange.start - 1,
        ogSectionRange.end
      );
      const sectionToEditContent = lineRangeArray.join("\n");

      const filledImpChangesPrompt = applyChangesPrompt
        .replace("{sectionName}", sectionToEdit)
        .replace("{sectionContent}", sectionToEditContent)
        .replace("{changeInstructions}", changeInstructions);

      const updPromptSectionBuffer = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: filledImpChangesPrompt }],
      });

      const newSectionContent: string | null =
        updPromptSectionBuffer.choices[0].message.content;
      console.log(`-> New section content generated.`);

      let newSectionRange: { start: number; end: number } | null;

      if (newSectionContent) {
        successfulChangeCount++;

        const newSectionLength = newSectionContent.split("\n").length;
        const oldSectionLength = ogSectionRange.end - ogSectionRange.start + 1;
        console.log(
          `New section length: ${newSectionLength}, Old section length: ${oldSectionLength}`
        );

        const lineDiff: number = newSectionLength - oldSectionLength;

        console.log(`Line diff: ${lineDiff}`);

        const newSectionRangeEnd = ogSectionRange.end + lineDiff;
        newSectionRange = {
          start: ogSectionRange.start,
          end: newSectionRangeEnd,
        };
        console.log(
          `New section range: ${newSectionRange.start}-${newSectionRange.end}`
        );

        // function to add lineDiffToAdd to all the sections start and end in indexTreeJson.md
        const updatedIndexTreeJson = updateIndexTree(
          tempIndexTreeJson,
          newSectionRange,
          sectionToEdit,
          lineDiff
        );
        // write it to updatedindexTree.md

        const BeforeNewSectionLines: string[] = tempPromptLines.slice(
          0,
          ogSectionRange.start - 1
        );
        const AfterNewSectionLines: string[] = tempPromptLines.slice(
          ogSectionRange.end
        );
        const NewSectionLines: string[] = newSectionContent.split("\n");

        const newPromptLines: string[] = [
          ...BeforeNewSectionLines,
          ...NewSectionLines,
          ...AfterNewSectionLines,
        ];
        const updPromptContent: string = newPromptLines.join("\n");

        // update prompt and indexTree after each round
        tempPromptContent = updPromptContent;
        tempIndexTree = JSON.stringify(updatedIndexTreeJson, null, 2);

        results.push({
          section: sectionToEdit,
          success: true,
          newContent: newSectionContent
        });
      }
    }

    const finalPrompt = tempPromptContent;
    const finalIndexTree = tempIndexTree;
    
    return {
      updatedPrompt: finalPrompt,
      updatedIndexTree: finalIndexTree,
      successfulChangeCount,
      changes: results
    };
  } catch (error) {
    console.error("[applyChanges] Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      changeListPreview: changeList.substring(0, 100) + "..."
    });
    throw error;
  }
}

async function applyChange(
  change: Change,
  currentPrompt: string,
  currentIndexTree: string
): Promise<ApplyChangeResult> {
  try {
    console.log("[applyChange] Starting with inputs:", {
      changeSection: change.sectionToEdit,
      changeInstructionsLength: change.changeInstructions.length,
      currentPromptLength: currentPrompt.length,
      currentIndexTreeLength: currentIndexTree.length
    });
    
    // Parse the current index tree
    const indexTreeJson = JSON.parse(currentIndexTree);
    
    // Find the section to edit
    const sectionRange = findLineRange(indexTreeJson, change.sectionToEdit);
    if (!sectionRange) {
      return {
        updatedPrompt: currentPrompt,
        updatedIndexTree: currentIndexTree,
        result: {
          section: change.sectionToEdit,
          success: false,
          error: `Section "${change.sectionToEdit}" not found in index tree`
        }
      };
    }

    // Get the content of the section to edit
    const promptLines = currentPrompt.split("\n");
    const sectionContent = promptLines
      .slice(sectionRange.start - 1, sectionRange.end)
      .join("\n");

    // Create the prompt for applying changes
    const applyChangesPromptFilePath = path.join(__dirname, "..", "..", "..", "prompts", "applyChanges.md");
    const applyChangesPrompt = readFileSync(applyChangesPromptFilePath, "utf-8")
      .replace("{sectionToEdit}", change.sectionToEdit)
      .replace("{sectionContent}", sectionContent)
      .replace("{changeInstructions}", change.changeInstructions);

    // Get the completion from OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: applyChangesPrompt }],
      temperature: 0,
    });

    const newSectionContent = completion.choices[0].message.content || "";
    const NewSectionLines = newSectionContent.split("\n");
    const lineDiff = NewSectionLines.length - (sectionRange.end - sectionRange.start + 1);

    // Update the index tree
    const updatedIndexTreeJson = updateIndexTree(
      indexTreeJson,
      {
        start: sectionRange.start,
        end: sectionRange.end + lineDiff,
      },
      change.sectionToEdit,
      lineDiff
    );

    // Update the prompt content
    const BeforeNewSectionLines = promptLines.slice(0, sectionRange.start - 1);
    const AfterNewSectionLines = promptLines.slice(sectionRange.end);
    const newPromptLines = [
      ...BeforeNewSectionLines,
      ...NewSectionLines,
      ...AfterNewSectionLines,
    ];

    const updatedPrompt = newPromptLines.join("\n");
    const updatedIndexTree = JSON.stringify(updatedIndexTreeJson, null, 2);

    return {
      updatedPrompt: updatedPrompt,
      updatedIndexTree: updatedIndexTree,
      result: {
        section: change.sectionToEdit,
        success: true,
      }
    };
  } catch (error) {
    console.error("[applyChange] Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      changeSection: change.sectionToEdit
    });
    throw error;
  }
}

// function find line range with indexTreeJson, sectionToEdit
function findLineRange(
  indexTreeJson: JsonNode[],
  sectionToEdit: string
): { start: number; end: number } | null {
  for (const section of indexTreeJson) {
    if (section.sectionName === sectionToEdit) {
      return { start: section.start, end: section.end };
    }

    if (section.children) {
      const sectionRange = findLineRange(section.children, sectionToEdit);
      if (sectionRange) {
        return sectionRange;
      }
    }
  }

  return null;
}

function updateIndexTree(
  indexTreeJson: JsonNode[],
  newSectionRange: { start: number; end: number },
  sectionToEdit: string,
  lineDiff: number
): JsonNode[] {
  let foundStatus: boolean = false;

  function updateTree(tree: JsonNode[], isBelowFound: boolean): JsonNode[] {
    for (const section of tree) {
      // Update the section if it matches the one to edit
      if (!foundStatus && section.sectionName === sectionToEdit) {
        section.start = newSectionRange.start;
        section.end = newSectionRange.end;
        foundStatus = true;
        isBelowFound = true; // Update the flag since the section is now found
        continue; // Skip further processing of this section
      }

      // If we are below the found section, adjust the start and end
      if (isBelowFound) {
        section.start += lineDiff;
        section.end += lineDiff;
      }

      // Recursively process children
      if (section.children) {
        updateTree(section.children, isBelowFound);
      }
    }

    return indexTreeJson;
  }

  const updatedIndexTreeJson = updateTree(indexTreeJson, false);
  return updatedIndexTreeJson;
}

// API Endpoints
app.post<CreateIndexTreeRequest, ApiResult<CreateIndexTreeResponse>>("/api/create-index-tree", async (req, res): Promise<void> => {
  try {
    const { feedback, prompt } = req.body;
    
    if (!feedback || !prompt) {
      res.status(400).json({ 
        success: false, 
        error: "Missing required parameters: feedback and prompt" 
      });
      return;
    }
    
    const indexTree = await createIndexTree(feedback, prompt);
    res.json({ 
      success: true, 
      data: { indexTree } 
    });
  } catch (error) {
    console.error("Error in create-index-tree:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create index tree",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.post<CreateChangeListRequest, ApiResult<CreateChangeListResponse>>("/api/create-change-list", async (req, res): Promise<void> => {
  try {
    const { prompt, indexTree, feedback } = req.body;
    
    if (!prompt || !indexTree || !feedback) {
      res.status(400).json({ 
        success: false, 
        error: "Missing required parameters: prompt, indexTree and feedback" 
      });
      return;
    }
    
    const changeList = await createChangeList(prompt, indexTree, feedback);
    res.json({ 
      success: true, 
      data: { changeList } 
    });
  } catch (error) {
    console.error("Error in create-change-list:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create change list",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.post<ApplyChangeRequest, ApiResult<ApplyChangeResponse>>("/api/apply-changes", async (req, res): Promise<void> => {
  try {
    console.log("[/api/apply-changes] Received request");
    const { change, currentPrompt, currentIndexTree } = req.body;
    
    if (!change || !currentPrompt || !currentIndexTree) {
      console.error("[/api/apply-changes] Missing required parameters:", {
        hasChange: !!change,
        hasPrompt: !!currentPrompt,
        hasIndexTree: !!currentIndexTree
      });
      res.status(400).json({ 
        success: false, 
        error: "Missing required parameters: change, currentPrompt, and currentIndexTree" 
      });
      return;
    }
    
    console.log("[/api/apply-changes] Applying change for section:", change.sectionToEdit);
    const result = await applyChange(change, currentPrompt, currentIndexTree);
    
    console.log("[/api/apply-changes] Change applied successfully:", {
      section: change.sectionToEdit,
      success: result.result.success
    });
    
    res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error("[/api/apply-changes] Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to apply changes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
