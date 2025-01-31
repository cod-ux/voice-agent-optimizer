"use strict";
// Step 1: Read inputs - Feedback, OG Prompt, optimizer-prompt
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path = require("path");
var openai_1 = require("openai");
require("dotenv/config");
var zod_1 = require("openai/helpers/zod");
var zod_2 = require("zod");
var feedbackFilePath = path.join(__dirname, "..", "..", "..", "..", "inputs", "feedback.txt");
var ogPromptFilePath = path.join(__dirname, "..", "..", "..", "..", "inputs", "ogPrompt.md");
var createIndexTreeFilePath = path.join(__dirname, "..", "..", "..", "..", "prompts", "createIndexTree.md");
var changeLogPath = path.join(__dirname, "..", "outputs", "changeLogs.txt");
var feedback = (0, fs_1.readFileSync)(feedbackFilePath, "utf-8");
var ogPrompt = (0, fs_1.readFileSync)(ogPromptFilePath, "utf-8");
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
var DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;
var GROQ_KEY = process.env.GROQ_KEY;
var DS_client = new openai_1.default({
    baseURL: "https://api.deepseek.com",
    apiKey: DEEPSEEK_API_KEY,
});
var GROQ_client = new openai_1.default({
    apiKey: GROQ_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});
var client = new openai_1.default({
    apiKey: OPENAI_API_KEY,
});
var changeItemSchema = zod_2.z.object({
    sectionToEdit: zod_2.z.string(),
    changeInstructions: zod_2.z.string(),
});
var changeListSchema = zod_2.z.object({
    changeListArray: zod_2.z.array(changeItemSchema),
});
// function to add line numbers to ogPrompt
function addLineNumberToOgPrompt(ogPrompt) {
    // split ogPrompt into lines
    var lines = ogPrompt.split("\n");
    // add line number as 'line 1: ' to each line in ogPrompt
    var ogPromptWithLineNumbers = lines
        .map(function (line, i) { return "line ".concat(i + 1, ": ").concat(line); })
        .join("\n");
    return ogPromptWithLineNumbers;
}
// test to create Index tree with line ranges
function createIndexTree() {
    return __awaiter(this, void 0, void 0, function () {
        var ogPromptWithLineNumbers, createIndexTreePrompt, filledCreateIndexTreePrompt, indexTreeBuffer, indexTree, startIndex, endIndex, indexTreeJsonString, indexTreePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Step 1: Adding line numbers to ogPrompt");
                    ogPromptWithLineNumbers = addLineNumberToOgPrompt(ogPrompt);
                    console.log("Step 2: Sending to LLM to create hierarchical tree with line ranges");
                    createIndexTreePrompt = (0, fs_1.readFileSync)(createIndexTreeFilePath, "utf-8");
                    filledCreateIndexTreePrompt = createIndexTreePrompt.replace("{ogPrompt}", ogPromptWithLineNumbers);
                    return [4 /*yield*/, client.chat.completions.create({
                            model: "gpt-4o",
                            messages: [{ role: "user", content: filledCreateIndexTreePrompt }],
                        })];
                case 1:
                    indexTreeBuffer = _a.sent();
                    indexTree = indexTreeBuffer.choices[0].message.content;
                    console.log("Step 3: Saving indexTree to file");
                    // step 3: create indexTree.md
                    // check if its json format and then save it
                    if (!indexTree) {
                        throw new Error("Invalid response from LLM: Missing content.");
                    }
                    startIndex = indexTree.indexOf("```json") + "```json".length;
                    endIndex = indexTree.indexOf("```", startIndex);
                    indexTreeJsonString = indexTree.substring(startIndex, endIndex);
                    indexTreePath = path.join(__dirname, "..", "..", "outputs", "indexTree.md");
                    (0, fs_1.writeFileSync)(indexTreePath, indexTreeJsonString);
                    return [2 /*return*/];
            }
        });
    });
}
// function to send ogPrompt, indexTree and feedback to openai to ask it to return a list of changes to make
function createChangeList() {
    return __awaiter(this, void 0, void 0, function () {
        var indexTreeFilePath, indexTree, createChangeListPromptFilePath, createChangeListPrompt, filledCreateChangeListPrompt, changeListBuffer, changeList, changeListText, changeListPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Step 1: Sending to LLM to create change log");
                    indexTreeFilePath = path.join(__dirname, "..", "..", "outputs", "indexTree.md");
                    indexTree = (0, fs_1.readFileSync)(indexTreeFilePath, "utf-8");
                    createChangeListPromptFilePath = path.join(__dirname, "..", "..", "..", "..", "prompts", "createChangeList.md");
                    createChangeListPrompt = (0, fs_1.readFileSync)(createChangeListPromptFilePath, "utf-8");
                    filledCreateChangeListPrompt = createChangeListPrompt
                        .replace("{indexTree}", indexTree)
                        .replace("{feedback}", feedback)
                        .replace("{ogPrompt}", ogPrompt);
                    return [4 /*yield*/, client.beta.chat.completions.parse({
                            model: "gpt-4o",
                            messages: [{ role: "user", content: filledCreateChangeListPrompt }],
                            response_format: (0, zod_1.zodResponseFormat)(changeListSchema, "change_list"),
                        })];
                case 1:
                    changeListBuffer = _a.sent();
                    changeList = changeListBuffer.choices[0].message.parsed;
                    console.log("Step 2: Saving changeList to file");
                    // step 2: create changeList.md
                    if (!changeList) {
                        throw new Error("Invalid response from LLM: Missing content.");
                    }
                    changeListText = JSON.stringify(changeList, null, 2);
                    changeListPath = path.join(__dirname, "..", "outputs", "changeList.md");
                    (0, fs_1.writeFileSync)(changeListPath, changeListText);
                    console.log("Step 3: Done");
                    return [2 /*return*/];
            }
        });
    });
}
function applyChanges() {
    return __awaiter(this, void 0, void 0, function () {
        var changeListFilePath, changeList, changeListJson, applyChangesPromptFilePath, applyChangesPrompt, changeListArray, ogPromptContent, indexTreeFilePath, ogIndexTree, successfulChangeCount, updatedIndexTreeFilePath, updatedPromptFilePath, i, change, sectionToEdit, changeInstructions, tempIndexTree, tempPromptContent, tempIndexTreeJson, ogSectionRange, tempPromptLines, lineRangeArray, sectionToEditContent, filledImpChangesPrompt, updPromptSectionBuffer, newSectionContent, newSectionRange, newSectionLength, oldSectionLength, lineDiff, newSectionRangeEnd, updatedIndexTreeJson, updatedIndexTreeFilePath_1, BeforeNewSectionLines, AfterNewSectionLines, NewSectionLines, newPromptLines, newPromptContent, newPromptFilePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    changeListFilePath = path.join(__dirname, "..", "..", "outputs", "changeList.md");
                    changeList = (0, fs_1.readFileSync)(changeListFilePath, "utf-8");
                    if (!changeList) {
                        throw new Error("Invalid response from LLM: Missing content.");
                    }
                    changeListJson = JSON.parse(changeList);
                    applyChangesPromptFilePath = path.join(__dirname, "..", "..", "..", "..", "prompts", "applyChanges.md");
                    applyChangesPrompt = (0, fs_1.readFileSync)(applyChangesPromptFilePath, "utf-8");
                    changeListArray = changeListJson.changeListArray;
                    ogPromptContent = (0, fs_1.readFileSync)(ogPromptFilePath, "utf-8");
                    indexTreeFilePath = path.join(__dirname, "..", "..", "outputs", "indexTree.md");
                    ogIndexTree = (0, fs_1.readFileSync)(indexTreeFilePath, "utf-8");
                    successfulChangeCount = 0;
                    updatedIndexTreeFilePath = path.join(__dirname, "..", "..", "outputs", "updatedIndexTree.md");
                    (0, fs_1.writeFileSync)(updatedIndexTreeFilePath, ogIndexTree);
                    updatedPromptFilePath = path.join(__dirname, "..", "..", "outputs", "updatedPrompt.md");
                    (0, fs_1.writeFileSync)(updatedPromptFilePath, ogPromptContent);
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < changeListArray.length)) return [3 /*break*/, 4];
                    change = changeListArray[i];
                    sectionToEdit = change.sectionToEdit;
                    changeInstructions = change.changeInstructions;
                    tempIndexTree = (0, fs_1.readFileSync)(updatedIndexTreeFilePath, "utf-8");
                    tempPromptContent = (0, fs_1.readFileSync)(updatedPromptFilePath, "utf-8");
                    console.log("Processing change ".concat(i + 1, " of ").concat(changeListArray.length, " - Section: ").concat(sectionToEdit));
                    tempIndexTreeJson = JSON.parse(tempIndexTree);
                    ogSectionRange = findLineRange(tempIndexTreeJson, sectionToEdit);
                    try {
                        if (!ogSectionRange) {
                            throw new Error("Invalid section name: " + sectionToEdit);
                        }
                    }
                    catch (error) {
                        console.error("Error in applyChanges: ".concat(error));
                        return [3 /*break*/, 3];
                    }
                    console.log("Section ".concat(sectionToEdit, " found at line range ").concat(ogSectionRange.start, "-").concat(ogSectionRange.end));
                    tempPromptLines = tempPromptContent.split("\n");
                    lineRangeArray = tempPromptLines.slice(ogSectionRange.start - 1, ogSectionRange.end);
                    sectionToEditContent = lineRangeArray.join("\n");
                    filledImpChangesPrompt = applyChangesPrompt
                        .replace("{sectionName}", sectionToEdit)
                        .replace("{sectionContent}", sectionToEditContent)
                        .replace("{changeInstructions}", changeInstructions);
                    return [4 /*yield*/, client.chat.completions.create({
                            model: "gpt-4o",
                            messages: [{ role: "user", content: filledImpChangesPrompt }],
                        })];
                case 2:
                    updPromptSectionBuffer = _a.sent();
                    newSectionContent = updPromptSectionBuffer.choices[0].message.content;
                    console.log("-> New section content generated.");
                    newSectionRange = void 0;
                    if (newSectionContent) {
                        successfulChangeCount++;
                        newSectionLength = newSectionContent.split("\n").length;
                        oldSectionLength = ogSectionRange.end - ogSectionRange.start + 1;
                        console.log("New section length: ".concat(newSectionLength, ", Old section length: ").concat(oldSectionLength));
                        lineDiff = newSectionLength - oldSectionLength;
                        console.log("Line diff: ".concat(lineDiff));
                        newSectionRangeEnd = ogSectionRange.end + lineDiff;
                        newSectionRange = {
                            start: ogSectionRange.start,
                            end: newSectionRangeEnd,
                        };
                        console.log("New section range: ".concat(newSectionRange.start, "-").concat(newSectionRange.end));
                        updatedIndexTreeJson = updateIndexTree(tempIndexTreeJson, newSectionRange, sectionToEdit, lineDiff);
                        updatedIndexTreeFilePath_1 = path.join(__dirname, "..", "..", "outputs", "updatedIndexTree.md");
                        (0, fs_1.writeFileSync)(updatedIndexTreeFilePath_1, JSON.stringify(updatedIndexTreeJson, null, 2));
                        BeforeNewSectionLines = tempPromptLines.slice(0, ogSectionRange.start - 1);
                        AfterNewSectionLines = tempPromptLines.slice(ogSectionRange.end);
                        NewSectionLines = newSectionContent.split("\n");
                        newPromptLines = __spreadArray(__spreadArray(__spreadArray([], BeforeNewSectionLines, true), NewSectionLines, true), AfterNewSectionLines, true);
                        newPromptContent = newPromptLines.join("\n");
                        newPromptFilePath = path.join(__dirname, "..", "..", "outputs", "updatedPrompt.md");
                        (0, fs_1.writeFileSync)(newPromptFilePath, newPromptContent);
                    }
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// function find line range with indexTreeJson, sectionToEdit
function findLineRange(indexTreeJson, sectionToEdit) {
    for (var _i = 0, indexTreeJson_1 = indexTreeJson; _i < indexTreeJson_1.length; _i++) {
        var section = indexTreeJson_1[_i];
        if (section.sectionName === sectionToEdit) {
            return { start: section.start, end: section.end };
        }
        if (section.children) {
            var sectionRange = findLineRange(section.children, sectionToEdit);
            if (sectionRange) {
                return sectionRange;
            }
        }
    }
    return null;
}
function updateIndexTree(indexTreeJson, newSectionRange, sectionToEdit, lineDiff) {
    var foundStatus = false;
    function updateTree(tree, isBelowFound) {
        for (var _i = 0, tree_1 = tree; _i < tree_1.length; _i++) {
            var section = tree_1[_i];
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
    var updatedIndexTreeJson = updateTree(indexTreeJson, false);
    return updatedIndexTreeJson;
}
function pipeline() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createIndexTree()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, createChangeList()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, applyChanges()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
pipeline();
