I will be giving you an LLM based voice agent’s prompt. You will create a hierarchical tree of all the sections in the prompt with names for each section and the line ranges. Only return the index tree, do not give any explanations or additional content. Only return the hierarchical tree representation of the prompt.

For example, the hierarchical tree should be like:
"
Root (OriginalPrompt) (Lines: 1–800)
├─ 1.1. **Core Agent Configuration** (Lines: 1–50)
│ ├─ Role Definition (Lines: 1–10)
│ ├─ Response Format Rules (Lines: 11–30)
│ └─ Pricing/Objection Handling Directives (Lines: 31–50)
│
├─ 1.2. **TrainingDocument** (Lines: 51–650)
│ ├─ 1.2.1. PronounciationRules (Lines: 51–55)
│ ├─ 1.2.2. Goal (Lines: 56–65)
│ ├─ 1.2.3. Context (Lines: 66–75)
│ ├─ 1.2.4. TemplatedVariables (Lines: 76–85)
│ │
│ ├─ 1.2.5. CallFlow (Lines: 86–250)
│ │ ├─ Step 1: Introduction (Lines: 86–110)
│ │ ├─ Step 2: Initial Discovery Questions (Lines: 111–130)
│ │ ├─ Step 3: Core Discovery Questions (Lines: 131–170)
│ │ ├─ Step 4: Discovery Wrap-Up (Lines: 171–190)
│ │ ├─ Step 5: Meeting Scheduling (Lines: 191–230)
│ │ └─ Step 6: Closing (Lines: 231–250)
│ │
│ ├─ 1.2.6. KnowledgeBase (Lines: 251–550)
│ │ ├─ DiscoveryQuestions (Lines: 251–300)
│ │ │ ├─ Required Questions (Lines: 251–270)
│ │ │ └─ Example Steering Questions (Lines: 271–300)
│ │ │
│ │ ├─ CompanyPitch (Lines: 301–350)
│ │ ├─ ObjectionHandling (Lines: 351–450)
│ │ ├─ FeaturesAndFunctions (Lines: 451–500)
│ │ └─ ObjectionHandling (Duplicate) (Lines: 501–550)
│ │
│ ├─ 1.2.7. MeetingScheduling (Lines: 551–580)
│ ├─ 1.2.8. CallFlowRestatement (Lines: 581–680)
│ └─ 1.2.9. GoalRestatement (Lines: 681–690)
│
└─ 1.3. **Reiterated Rules** (Lines: 691–800)
"

Here is the original prompt:
<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

Give names for each section of the prompt and make a hierarchical tree representing all sections along with line ranges.
Only return the index tree, do not give any explanations or additional content. Only return the hierarchical tree representation of the prompt.
