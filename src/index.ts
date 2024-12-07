// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt

import { readFileSync } from "fs";
import * as path from 'path';
import OpenAI from "openai";


const feedbackFilePath = path.join(__dirname, "..", "inputs", "feedback.txt");
const ogPromptFilePath = path.join(__dirname, "..", "inputs", "ogPrompt.md");
const outputFilePath = path.join(__dirname, "outputs", "updatedPrompt.md");
const changeLogPath = path.join(__dirname, "outputs", "changeLogs.txt");

const feedback = readFileSync(feedbackFilePath, 'utf-8');
const ogPrompt = readFileSync(ogPromptFilePath, 'utf-8');

const client = new OpenAI({
  apiKey: ""
});

// Step 2: Break down OG prompt into prompt sections

// OG prompt (pre: xml tag warning) - extract content from each xml section, add a section name to object and put them in a list. Take KB as a whole don't break. Take GP's seperately, each untagged section as their own section until the next tag.

// Create a function for breaking down an xml file

interface PromptSegment {
  content: string;
  isTag: boolean;
  isKnowledgeBase?: boolean;
}

function parsePrompt(prompt: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const lines = prompt.split('\n');
  let currentContent = '';
  let inKnowledgeBase = false;
  let kbStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start of KnowledgeBase
    if (line.trim() === '<KnowledgeBase>' && !inKnowledgeBase) {
      // Push any content before KnowledgeBase
      if (currentContent) {
        segments.push({
          content: currentContent,
          isTag: false
        });
        currentContent = '';
      }
      inKnowledgeBase = true;
      kbStartIndex = i;
      continue;
    }
    
    // End of KnowledgeBase
    if (line.trim() === '</KnowledgeBase>' && inKnowledgeBase) {
      // Get all content between KB tags, including the tags
      const kbContent = lines.slice(kbStartIndex, i + 1).join('\n');
      segments.push({
        content: kbContent,
        isTag: false,
        isKnowledgeBase: true
      });
      inKnowledgeBase = false;
      continue;
    }

    // Skip lines while in KnowledgeBase
    if (inKnowledgeBase) {
      continue;
    }

    // Handle regular tags and content
    if (line.trim().match(/^<\/?[^>]+>$/)) {
      if (currentContent) {
        segments.push({
          content: currentContent,
          isTag: false
        });
      }
      segments.push({
        content: line.trim(),
        isTag: true
      });
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  }

  // Push any remaining content
  if (currentContent) {
    segments.push({
      content: currentContent,
      isTag: false
    });
  }

  return segments;
}

const segmentList = parsePrompt(ogPrompt);

// function to convert a phrase to embedding - using openai embeddings

async function embedPhrase(segment: PromptSegment): Promise<number[]> {
  const segmentContent: string = segment.content;

  const embeddingsObject = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: "",
    encoding_format: 'float'
  });

  const embeddings: number[] = embeddingsObject.data[0].embedding;

  return embeddings;
}

const embedding = embedPhrase(segmentList[1]);

console.log("Embedding: ", embedding);

// function to calculate cosine similarity for all the non-knowledgeBase non-tag phrases and return the top 5 most relevant phrases

// function to send llm request with feedback & original phrase, returning output phrase

// function that iterates through top 5 sections, get response from llms and replace in segments list