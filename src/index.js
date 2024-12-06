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
const outputFilePath = path.join(__dirname, "outputs", "updatedPrompt.md");
const changeLogPath = path.join(__dirname, "outputs", "changeLogs.txt");
const feedback = (0, fs_1.readFileSync)(feedbackFilePath, 'utf-8');
const ogPrompt = (0, fs_1.readFileSync)(ogPromptFilePath, 'utf-8');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_KEY = process.env.GROQ_KEY;
const client = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
function parsePrompt(prompt) {
    const segments = [];
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
        }
        else {
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
function embedPhrase(segment) {
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
// function to calculate cosine similarity for all the non-knowledgeBase non-tag phrases
// function to send llm request with feedback & original phrase, returning output phrase
// function that iterates through top 5 sections, get response from llms and replace in segments list
