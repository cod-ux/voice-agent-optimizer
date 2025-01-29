// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt

import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import OpenAI from "openai";
import "dotenv/config";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

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

const changeLogPath = path.join(__dirname, "outputs", "changeLogs.txt");

const feedback = readFileSync(feedbackFilePath, "utf-8");
const ogPrompt = readFileSync(ogPromptFilePath, "utf-8");

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

// test to create Index tree with line ranges
async function createIndexTree() {
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
}

// function to send ogPrompt, indexTree and feedback to openai to ask it to return a list of changes to make
async function createChangeList() {
  console.log("Step 1: Sending to LLM to create change log");
  const indexTreeFilePath = path.join(
    __dirname,
    "..",
    "outputs",
    "indexTree.md"
  );
  const indexTree = readFileSync(indexTreeFilePath, "utf-8");

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
    .replace("{ogPrompt}", ogPrompt);

  const changeListBuffer = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [{ role: "user", content: filledCreateChangeListPrompt }],
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
}

async function applyChanges() {
  const changeListFilePath = path.join(
    __dirname,
    "..",
    "outputs",
    "changeList.md"
  );
  const changeList = readFileSync(changeListFilePath, "utf-8");

  if (!changeList) {
    throw new Error("Invalid response from LLM: Missing content.");
  }

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

  let ogPromptContent = readFileSync(ogPromptFilePath, "utf-8");
  const indexTreeFilePath = path.join(
    __dirname,
    "..",
    "outputs",
    "indexTree.md"
  );
  const ogIndexTree = readFileSync(indexTreeFilePath, "utf-8");
  let successfulChangeCount = 0;

  const updatedIndexTreeFilePath = path.join(
    __dirname,
    "..",
    "outputs",
    "updatedIndexTree.md"
  );
  writeFileSync(updatedIndexTreeFilePath, ogIndexTree);

  const updatedPromptFilePath = path.join(
    __dirname,
    "..",
    "outputs",
    "updatedPrompt.md"
  );
  writeFileSync(updatedPromptFilePath, ogPromptContent);

  for (let i = 0; i < changeListArray.length; i++) {
    const change = changeListArray[i];
    const sectionToEdit = change.sectionToEdit;
    const changeInstructions = change.changeInstructions;

    const tempIndexTree = readFileSync(updatedIndexTreeFilePath, "utf-8");
    const tempPromptContent = readFileSync(updatedPromptFilePath, "utf-8");

    console.log(
      `Processing change ${i + 1} of ${
        changeListArray.length
      } - Section: ${sectionToEdit}`
    );

    const tempIndexTreeJson = JSON.parse(tempIndexTree);

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
      const updatedIndexTreeFilePath = path.join(
        __dirname,
        "..",
        "outputs",
        "updatedIndexTree.md"
      );
      writeFileSync(
        updatedIndexTreeFilePath,
        JSON.stringify(updatedIndexTreeJson, null, 2)
      );

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
      const newPromptContent: string = newPromptLines.join("\n");

      const newPromptFilePath = path.join(
        __dirname,
        "..",
        "outputs",
        "updatedPrompt.md"
      );
      writeFileSync(newPromptFilePath, newPromptContent);
    }
  }
}

interface JsonNode {
  sectionName: string;
  start: number;
  end: number;
  xmlHeading: boolean;
  children?: JsonNode[]; // Optional, since not all nodes have children
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

async function pipeline() {
  await createIndexTree();
  await createChangeList();
  await applyChanges();
}

pipeline();
