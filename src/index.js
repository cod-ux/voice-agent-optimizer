"use strict";
// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = __importStar(require("path"));
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
const feedbackFilePath = path.join(__dirname, "..", "inputs", "feedback.txt");
const ogPromptFilePath = path.join(__dirname, "..", "inputs", "ogPrompt.md");
const binaryFilteringFilePath = path.join(__dirname, "..", "inputs", "binaryFiltering.md");
const createIndexTreeFilePath = path.join(__dirname, "..", "prompts", "createIndexTree.md");
const changeLogPath = path.join(__dirname, "outputs", "changeLogs.txt");
const feedback = (0, fs_1.readFileSync)(feedbackFilePath, 'utf-8');
const ogPrompt = (0, fs_1.readFileSync)(ogPromptFilePath, 'utf-8');
const binaryFilteringPrompt = (0, fs_1.readFileSync)(binaryFilteringFilePath, 'utf-8');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;
const GROQ_KEY = process.env.GROQ_KEY;
const DS_client = new openai_1.default({
    baseURL: "https://api.deepseek.com",
    apiKey: DEEPSEEK_API_KEY,
});
const client = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
function parsePrompt(prompt) {
    const segments = [];
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
            }
            else if (line.trim() === '</KnowledgeBase>') {
                inKnowledgeBase = false;
            }
            segments.push({
                content: line.trim(),
                isTag: true,
                isKnowledgeBase: inKnowledgeBase
            });
        }
        else {
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
function embedSegment(segment) {
    return __awaiter(this, void 0, void 0, function* () {
        const segmentContent = segment.content;
        const embeddingsObject = yield client.embeddings.create({
            model: "text-embedding-ada-002",
            input: segmentContent,
            encoding_format: 'float'
        });
        const embeddings = embeddingsObject.data[0].embedding;
        return embeddings;
    });
}
function embedPhrase(phrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const embeddingsObject = yield client.embeddings.create({
            model: "text-embedding-ada-002",
            input: phrase,
            encoding_format: 'float'
        });
        const embedding = embeddingsObject.data[0].embedding;
        return embedding;
    });
}
function cosineSimilarity(A, B) {
    const dotProduct = A.reduce((sum, a, i) => sum + a * B[i], 0);
    const magnitudeA = Math.sqrt(A.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(B.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
// Return segments list with added embeddings
function generateSegmentList(prompt, feedbackString) {
    return __awaiter(this, void 0, void 0, function* () {
        // Pasrsing original prompt
        console.log("Parsing original prompt...");
        let segmentList = parsePrompt(prompt);
        // Embed segment content
        console.log("\nEmbedding segment contents...");
        for (let i = 0; i < segmentList.length; i++) {
            const currentSegment = segmentList[i];
            if (!currentSegment.isTag && !currentSegment.isKnowledgeBase) {
                console.log(` -> Processing Segment: ${i + 1}/${segmentList.length}`);
                currentSegment.embedding = yield embedSegment(currentSegment);
                segmentList[i] = currentSegment;
            }
        }
        // Scoring prompt segments
        console.log("\nScoring prompt segments...");
        const feedbackEmbedding = yield embedPhrase(feedbackString);
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
    });
}
function submain(prompt, feedbackString) {
    return __awaiter(this, void 0, void 0, function* () {
        const sysPromptFilePath = path.join(__dirname, "..", "inputs", "sysPrompt.md");
        const userPromptFilePath = path.join(__dirname, "..", "inputs", "userPrompt.md");
        const summaryPromptFilePath = path.join(__dirname, "..", "inputs", "summaryPrompt.md");
        const changelogPromptFilePath = path.join(__dirname, "..", "inputs", "changelogPrompt.md");
        const outputFilePath = path.join(__dirname, "outputs", "updatedPrompt.md");
        const changeLogPath = path.join(__dirname, "outputs", "changeLog.md");
        const systemPrompt = (0, fs_1.readFileSync)(sysPromptFilePath, 'utf-8');
        let userPrompt = (0, fs_1.readFileSync)(userPromptFilePath, 'utf-8');
        const summaryPrompt = (0, fs_1.readFileSync)(summaryPromptFilePath, 'utf-8');
        const changelogPrompt = (0, fs_1.readFileSync)(changelogPromptFilePath, 'utf-8');
        // Initialize changelog string
        let changelog = '';
        // Generate context summary first
        console.log("Generating context summary...");
        const filledSummaryPrompt = summaryPrompt
            .replace('{feedback}', feedbackString)
            .replace('{original_prompt}', ogPrompt);
        let contextSummary = '';
        try {
            const summaryCompletion = yield client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "user", content: filledSummaryPrompt }
                ]
            });
            contextSummary = summaryCompletion.choices[0].message.content || '';
            console.log("Context summary generated successfully");
            console.log("Context summary: ", contextSummary);
        }
        catch (error) {
            console.error("Error generating context summary:", error);
            contextSummary = "Error generating context summary";
        }
        // Parse original prompt and get embeddings/scores
        console.log("Parsing and scoring prompt segments...");
        let segmentList = yield generateSegmentList(prompt, feedbackString);
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
                    const completion = yield client.chat.completions.create({
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
                        const changelogCompletion = yield client.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                { role: "user", content: filledChangelogPrompt }
                            ]
                        });
                        changelog += changelogCompletion.choices[0].message.content + '\n\n-----------------------------------\n\n';
                    }
                    catch (error) {
                        console.error("Error generating changelog for segment:", error);
                        changelog += `Failed to generate changelog for segment ${i + 1}\n\n-----------------------------------\n\n`;
                    }
                }
                catch (error) {
                    console.error(`Error processing segment ${i + 1}:`, error);
                    updatedPrompt += segment.content + '\n';
                    changelog += `Failed to process segment ${i + 1}\n\n-----------------------------------\n\n`;
                }
            }
            else {
                // Keep original content for non-top segments
                updatedPrompt += segment.content + '\n';
            }
        }
        // Write changelog to file
        (0, fs_1.writeFileSync)(changeLogPath, changelog, 'utf-8');
        console.log("Change log written to:", changeLogPath);
        // Write updated prompt to file
        (0, fs_1.writeFileSync)(outputFilePath, updatedPrompt, 'utf-8');
        console.log("Updated prompt written to:", outputFilePath);
        return updatedPrompt;
    });
}
// submain(ogPrompt, feedback);
function filterSegments(segments) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    const completion = yield DS_client.chat.completions.create({
                        model: "deepseek-reasoner",
                        messages: [
                            { role: "user", content: chooseSegmentsPlusContext }
                        ]
                    });
                    console.log(completion.choices[0].message.content);
                    let response = completion.choices[0].message.content;
                    if ((response === null || response === void 0 ? void 0 : response.trim()) === "1") {
                        filteredSegments.push(segment);
                    }
                }
                catch (error) {
                    console.error(`Error processing segment ${i + 1}:`, error);
                }
            }
        }
        return filteredSegments;
    });
}
// function to take scores and return the top 5 most relevant segments
function getTopSegments(segments) {
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
function binaryFiltering() {
    return __awaiter(this, void 0, void 0, function* () {
        let segmentsList = parsePrompt(ogPrompt);
        let filteredList = yield filterSegments(segmentsList);
        console.log(filteredList);
        console.log("Length: ", filteredList.length);
    });
}
// function to score segments and return the top 2 most relevant segments
function semSimilarityFiltering() {
    return __awaiter(this, void 0, void 0, function* () {
        let segmentsList = yield generateSegmentList(ogPrompt, feedback);
        let topSegments = getTopSegments(segmentsList);
        console.log(topSegments);
    });
}
// function to add line numbers to ogPrompt
function addLineNumberToOgPrompt(ogPrompt) {
    // split ogPrompt into lines
    const lines = ogPrompt.split('\n');
    // add line number as 'line 1: ' to each line in ogPrompt
    const ogPromptWithLineNumbers = lines.map((line, i) => `line ${i + 1}: ${line}`).join('\n');
    return ogPromptWithLineNumbers;
}
// test to create Index tree with line ranges
function createIndexTree() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Step 1: Adding line numbers to ogPrompt");
        // step 1: add line numbers to ogprompt
        // add line number as 'line 1: ' to each line in ogPrompt
        let ogPromptWithLineNumbers = addLineNumberToOgPrompt(ogPrompt);
        console.log("Step 2: Sending to LLM to create hierarchical tree with line ranges");
        // step 2: send to llm and make hierarchical tree with line ranges
        const createIndexTreePrompt = (0, fs_1.readFileSync)(createIndexTreeFilePath, 'utf-8');
        const filledCreateIndexTreePrompt = createIndexTreePrompt.replace('{ogPrompt}', ogPromptWithLineNumbers);
        const indexTreeBuffer = yield DS_client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "user", content: filledCreateIndexTreePrompt }
            ]
        });
        const indexTree = indexTreeBuffer.choices[0].message.content;
        console.log("Step 3: Saving indexTree to file");
        // step 3: create indexTree.md
        if (!indexTree) {
            throw new Error("Invalid response from LLM: Missing content.");
        }
        // save the index tree to src/outputs
        let indexTreePath = path.join(__dirname, "outputs", "indexTree.md");
        (0, fs_1.writeFileSync)(indexTreePath, indexTree);
    });
}
createIndexTree();
// create list of change instructions
