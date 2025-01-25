// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt

import { readFileSync, writeFileSync } from "fs";
import * as path from 'path';
import OpenAI from "openai";
import 'dotenv/config';
import { zodResponseFormat } from "openai/helpers/zod";
import {z} from "zod";


const feedbackFilePath = path.join(__dirname, "..", "inputs", "feedback.txt");
const ogPromptFilePath = path.join(__dirname, "..", "inputs", "ogPrompt.md");
const binaryFilteringFilePath = path.join(__dirname, "..", "inputs", "binaryFiltering.md");
const createIndexTreeFilePath = path.join(__dirname, "..", "prompts", "createIndexTree.md");
const predictionPromptFilePath = path.join(__dirname, "..", "prompts", "predictionPrompt.md");

const changeLogPath = path.join(__dirname, "outputs", "changeLogs.txt");

const feedback = readFileSync(feedbackFilePath, 'utf-8');
const ogPrompt = readFileSync(ogPromptFilePath, 'utf-8');
const binaryFilteringPrompt = readFileSync(binaryFilteringFilePath, 'utf-8');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;
const GROQ_KEY = process.env.GROQ_KEY;

const DS_client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: DEEPSEEK_API_KEY,
});

const GROQ_client = new OpenAI({
  apiKey: GROQ_KEY,
  baseURL: "https://api.groq.com/openai/v1"
})

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const changeItemSchema = z.object({
  sectionToEdit: z.string(),
  changeInstructions: z.string(),
})

const changeListSchema = z.object({
  changeListArray: z.array(changeItemSchema)
})

// Step 2: Break down OG prompt into prompt sections

// OG prompt (pre: xml tag warning) - extract content from each xml section, add a section name to object and put them in a list. Take KB as a whole don't break. Take GP's seperately, each untagged section as their own section until the next tag.

// Create a function for breaking down an xml file

interface PromptSegment {
  content: string;
  isTag: boolean;
  isKnowledgeBase?: boolean;
  score?: number;
  embedding?: number[];
}

function parsePrompt(prompt: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const lines = prompt.split('\n');
  let currentContent = '';
  let inKnowledgeBase = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle tags
    if (line.trim().match(/^<\/?[^>]+>$/)) {
      // Push any accumulated content before handling the tag
      if (currentContent) {
        segments.push({
          content: currentContent,
          isTag: false,
          isKnowledgeBase: inKnowledgeBase
        });
        currentContent = '';
      }

      // Handle KnowledgeBase tags
      if (line.trim() === '<KnowledgeBase>') {
        inKnowledgeBase = true;
      } else if (line.trim() === '</KnowledgeBase>') {
        inKnowledgeBase = false;
      }

      segments.push({
        content: line.trim(),
        isTag: true,
        isKnowledgeBase: inKnowledgeBase
      });
    } else {
      // Accumulate content
      currentContent += line + '\n';
    }
  }

  // Push any remaining content
  if (currentContent) {
    segments.push({
      content: currentContent,
      isTag: false,
      isKnowledgeBase: inKnowledgeBase
    });
  }

  return segments;
}

// function to convert a phrase to embedding - using openai embeddings

async function embedSegment(segment: PromptSegment): Promise<number[]> {
  const segmentContent: string = segment.content;

  const embeddingsObject = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: segmentContent,
    encoding_format: 'float'
  });

  const embeddings: number[] = embeddingsObject.data[0].embedding;

  return embeddings;
  
}

async function embedPhrase(phrase: string): Promise<number[]> {

  const embeddingsObject = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: phrase,
    encoding_format: 'float'
  });

  const embedding: number[] = embeddingsObject.data[0].embedding;

  return embedding;
  
}

function cosineSimilarity(A: number[], B: number[]): number {
  const dotProduct = A.reduce((sum, a, i) => sum + a*B[i], 0);

  const magnitudeA = Math.sqrt(A.reduce((sum, a) => sum + a*a, 0));
  const magnitudeB = Math.sqrt(B.reduce((sum, b) => sum + b*b, 0));

  return dotProduct/(magnitudeA * magnitudeB);
}

// Return segments list with added embeddings

async function generateSegmentList(prompt: string, feedbackString: string): Promise<PromptSegment[]> {
  
  // Pasrsing original prompt
  console.log("Parsing original prompt...")

  let segmentList = parsePrompt(prompt);

  // Embed segment content
  console.log("\nEmbedding segment contents...")

  for (let i=0; i < segmentList.length; i++) {
    const currentSegment = segmentList[i];
    if (!currentSegment.isTag && !currentSegment.isKnowledgeBase) {
      console.log(` -> Processing Segment: ${i+1}/${segmentList.length}`)
      currentSegment.embedding = await embedSegment(currentSegment);
      segmentList[i] = currentSegment

    }
  }

  // Scoring prompt segments
  console.log("\nScoring prompt segments...")

  const feedbackEmbedding = await embedPhrase(feedbackString);
  for (let i = 0; i < segmentList.length; i++) {
    const promptSegment = segmentList[i];
    if (promptSegment.embedding) {
      const segmentEmbedding = promptSegment.embedding;
      if (segmentEmbedding) {
        const segmentScore = cosineSimilarity(segmentEmbedding, feedbackEmbedding);
        promptSegment.score = segmentScore;
        segmentList[i] = promptSegment;
      }
    }
  }

  // Print the no of segments in segment list that aren't tags
  const contentSegments = segmentList.filter(segment => !segment.isTag);
  console.log("No. of content segments: ", contentSegments.length);
  return segmentList;


}

async function submain(prompt: string, feedbackString: string): Promise<string> {
  const sysPromptFilePath = path.join(__dirname, "..", "inputs", "sysPrompt.md");
  const userPromptFilePath = path.join(__dirname, "..", "inputs", "userPrompt.md");
  const summaryPromptFilePath = path.join(__dirname, "..", "inputs", "summaryPrompt.md");
  const changelogPromptFilePath = path.join(__dirname, "..", "inputs", "changelogPrompt.md");
  const outputFilePath = path.join(__dirname, "outputs", "updatedPrompt.md");
  const changeLogPath = path.join(__dirname, "outputs", "changeLog.md");
  
  const systemPrompt = readFileSync(sysPromptFilePath, 'utf-8');
  let userPrompt = readFileSync(userPromptFilePath, 'utf-8');
  const summaryPrompt = readFileSync(summaryPromptFilePath, 'utf-8');
  const changelogPrompt = readFileSync(changelogPromptFilePath, 'utf-8');
  
  // Initialize changelog string
  let changelog = '';
  
  // Generate context summary first
  console.log("Generating context summary...")
  const filledSummaryPrompt = summaryPrompt
    .replace('{feedback}', feedbackString)
    .replace('{original_prompt}', ogPrompt);
    
  let contextSummary = '';
  try {
    const summaryCompletion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: filledSummaryPrompt }
      ]
    });
    contextSummary = summaryCompletion.choices[0].message.content || '';
    console.log("Context summary generated successfully");
    console.log("Context summary: ", contextSummary);
  } catch (error) {
    console.error("Error generating context summary:", error);
    contextSummary = "Error generating context summary";
  }
  
  // Parse original prompt and get embeddings/scores
  console.log("Parsing and scoring prompt segments...")
  let segmentList = await generateSegmentList(prompt, feedbackString);
  let topSegments = getTopSegments(segmentList);
  let updatedPrompt = '';
  
  // Update prompts with context
  const systemPromptWithContext = systemPrompt.replace('{context_summary}', contextSummary);
  const userPromptWithContext = userPrompt;
  
  // Create a Set of top segment contents for quick lookup
  const topSegmentContents = new Set(topSegments.map(seg => seg.content));
  
  for (let i = 0; i < segmentList.length; i++) {
    const segment = segmentList[i];
    
    // Always preserve tags and empty segments
    if (segment.isTag || !segment.content.trim()) {
      updatedPrompt += segment.content + '\n';
      continue;
    }
    
    // Process if it's in top segments (including KB sections)
    if (topSegmentContents.has(segment.content)) {
      console.log(`Processing high-relevance segment ${i + 1}/${segmentList.length}`);
      
      const filledUserPrompt = userPromptWithContext
        .replace('{feedback}', feedbackString)
        .replace('{section}', segment.content)
        .replace('{original_prompt}', ogPrompt);
        
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPromptWithContext },
            { role: "user", content: filledUserPrompt }
          ]
        });
        
        const editedContent = completion.choices[0].message.content || segment.content;
        updatedPrompt += editedContent + '\n';
        
        // Generate changelog entry for this segment
        const filledChangelogPrompt = changelogPrompt
          .replace('{feedback}', feedbackString)
          .replace('{original_prompt}', segment.content)
          .replace('{updated_prompt}', editedContent);
          
        try {
          const changelogCompletion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "user", content: filledChangelogPrompt }
            ]
          });
          
          changelog += changelogCompletion.choices[0].message.content + '\n\n-----------------------------------\n\n';
        } catch (error) {
          console.error("Error generating changelog for segment:", error);
          changelog += `Failed to generate changelog for segment ${i + 1}\n\n-----------------------------------\n\n`;
        }
        
      } catch (error) {
        console.error(`Error processing segment ${i + 1}:`, error);
        updatedPrompt += segment.content + '\n';
        changelog += `Failed to process segment ${i + 1}\n\n-----------------------------------\n\n`;
      }
    } else {
      // Keep original content for non-top segments
      updatedPrompt += segment.content + '\n';
    }
  }
  
  // Write changelog to file
  writeFileSync(changeLogPath, changelog, 'utf-8');
  console.log("Change log written to:", changeLogPath);
  
  // Write updated prompt to file
  writeFileSync(outputFilePath, updatedPrompt, 'utf-8');
  console.log("Updated prompt written to:", outputFilePath);
  
  return updatedPrompt;
}

// submain(ogPrompt, feedback);

async function filterSegments(segments: PromptSegment[]): Promise<PromptSegment[]> {
  // TODO: implement this function
  console.log("Getting top segments with LLMs...");
  let filteredSegments = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment.isTag && !segment.isKnowledgeBase) {
      console.log(` -> Processing Segment: ${i + 1}/${segments.length}`);
      const chooseSegmentsPlusContext = binaryFilteringPrompt
        .replace('{section}', segment.content)
        .replace('{ogPrompt}', ogPrompt)
        .replace('{feedback}', feedback);
      
      try {
        const completion = await DS_client.chat.completions.create({
          model: "deepseek-reasoner",
          messages: [
            { role: "user", content: chooseSegmentsPlusContext }
          ]
        });
        console.log(completion.choices[0].message.content);
        let response = completion.choices[0].message.content;
        if (response?.trim() === "1") {
          filteredSegments.push(segment);
        }
      } catch (error) {
        console.error(`Error processing segment ${i + 1}:`, error);
      }
    }                                                   
  }
  return filteredSegments;

}

// function to take scores and return the top 5 most relevant segments

function getTopSegments(segments: PromptSegment[]): PromptSegment[] {
  // Sort segments by score in descending order
  const sortedSegments = [...segments].sort((a, b) => {
    // Handle undefined scores by treating them as 0
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });

  // Return top 10 segments, or all segments if less than 10
  return sortedSegments.slice(0, 5);
}



async function binaryFiltering () {
  let segmentsList = parsePrompt(ogPrompt);
  let filteredList = await filterSegments(segmentsList);
  console.log(filteredList);
  console.log("Length: ", filteredList.length);
}

// function to score segments and return the top 2 most relevant segments
async function semSimilarityFiltering() {
  let segmentsList = await generateSegmentList(ogPrompt, feedback);
  let topSegments = getTopSegments(segmentsList);

  console.log(topSegments);
}

// function to add line numbers to ogPrompt
function addLineNumberToOgPrompt(ogPrompt: string) {
  // split ogPrompt into lines
  const lines = ogPrompt.split('\n');
  // add line number as 'line 1: ' to each line in ogPrompt
  const ogPromptWithLineNumbers = lines.map((line, i) => `line ${i+1}: ${line}`).join('\n');
  return ogPromptWithLineNumbers;
}


async function predictionCall() {
  const predictionPrompt = readFileSync(predictionPromptFilePath, 'utf-8');
  const filledPredictionPrompt = predictionPrompt.replace('{feedback}', feedback);
  
  const predictionBuffer = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: filledPredictionPrompt }
    ],
    store: true,
    prediction: {
      type: "content",
      content: ogPrompt
    }
  })

  const prediction = predictionBuffer.choices[0].message.content;
  console.log("Step 4: Saving prediction to file");
  // step 4: create prediction.md
  if (!prediction) {
    throw new Error("Invalid response from LLM: Missing content.");
  }

  console.log("Prediction: ", prediction);

  let predictionPath = path.join(__dirname, "outputs", "prediction.md");
  writeFileSync(predictionPath, prediction);
}


// test to create Index tree with line ranges
async function createIndexTree() {
  console.log("Step 1: Adding line numbers to ogPrompt");
  // step 1: add line numbers to ogprompt

  // add line number as 'line 1: ' to each line in ogPrompt
  let ogPromptWithLineNumbers = addLineNumberToOgPrompt(ogPrompt);

  console.log("Step 2: Sending to LLM to create hierarchical tree with line ranges");
  // step 2: send to llm and make hierarchical tree with line ranges
  const createIndexTreePrompt = readFileSync(createIndexTreeFilePath, 'utf-8');
  const filledCreateIndexTreePrompt = createIndexTreePrompt.replace('{ogPrompt}', ogPromptWithLineNumbers);
  const indexTreeBuffer = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: filledCreateIndexTreePrompt }
    ]
  })

  const indexTree = indexTreeBuffer.choices[0].message.content;

  console.log("Step 3: Saving indexTree to file");
  // step 3: create indexTree.md
  if (!indexTree) {
    throw new Error("Invalid response from LLM: Missing content.");
  }

  // save the index tree to src/outputs
  let indexTreePath = path.join(__dirname, "outputs", "indexTree.md");
  writeFileSync(indexTreePath, indexTree);

}



// function to send ogPrompt, indexTree and feedback to openai to ask it to return a list of changes to make
async function createChangeList() {
  console.log("Step 1: Sending to LLM to create change log");
  const indexTreeFilePath = path.join(__dirname, "outputs", "indexTree.md");
  const indexTree = readFileSync(indexTreeFilePath, 'utf-8');

  const createChangeListPromptFilePath = path.join(__dirname, "..", "prompts", "createChangeList.md");
  const createChangeListPrompt = readFileSync(createChangeListPromptFilePath, 'utf-8');
  const filledCreateChangeListPrompt = createChangeListPrompt.replace('{indexTree}', indexTree).replace('{feedback}', feedback).replace('{ogPrompt}', ogPrompt);

  const changeListBuffer = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      { role: "user", content: filledCreateChangeListPrompt }
    ],
    response_format: zodResponseFormat(changeListSchema, "change_list")
  })
  const changeList = changeListBuffer.choices[0].message.parsed;
  console.log("Step 2: Saving changeList to file");
  // step 2: create changeList.md
  if (!changeList) {
    throw new Error("Invalid response from LLM: Missing content.");
  }

  const changeListText = JSON.stringify(changeList, null, 2);
  let changeListPath = path.join(__dirname, "outputs", "changeList.md");
  writeFileSync(changeListPath, changeListText);
  console.log("Step 3: Done");
}

async function impChanges() {
  
}


async function pipeline() {
  await createIndexTree();
  await createChangeList();
}

pipeline();