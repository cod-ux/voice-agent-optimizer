You will analyze an LLM-based voice agent’s prompt and provide a list of edits to implement specific feedback. Use the index tree of the prompt (a structured hierarchical breakdown of its sections) to identify the exact sections requiring changes. For each edit, specify:

1. Mention the exact section name from the index tree (not the original prompt, use the index tree for naming sections to edit).
2. Describe the change that needs to be made to implement the feedback and instructions on how to implement the change. Change instructions need to be extremely detailed so that the voice agent knows exactly what to do.

Feedback:
{feedback}

Index tree:
<IndexTree>
{indexTree}
</IndexTree>

Instructions:
<InstructionsToFollow>

1. Only make necessary edits to address the feedback.
2. Mention the exact section names from the <IndexTree> that needs to be modified for each change (not the original prompt, use the index tree for naming sections to edit). All section names are unique, so additional info on how to find the section isn't required. We need the exact section name to make changes effectively.
3. Name of the section needs to be from <IndexTree> provided.
4. Include all necessary changes to fully implement the feedback.
5. Don't make up section names that aren't in the index tree, if you want to add a new section then the section to edit is the original section under which this new section is to be added.
6. Do not include '<', '>' characters in the section names.
7. Provide a concise list of changes in the following format. Example JSON Output:

```
{
  "changeListArray": [
    {
      "sectionToEdit": "exact section name from index tree",
      "changeInstructions": "change instructions'."
    },
    {
      "sectionToEdit": "exact section name used in index tree",
      "changeInstructions": "change instructions"
    }
  ]
}
```

</InstructionsToFollow>

Original Prompt:
<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

Follow the instructions mentioned in the <InstructionsToFollow/> section at all times to make list of well-formated changes that need to be made to implement customer feedback.

<InstructionsToFollow>

1. Only make necessary edits to address the feedback.
2. Mention the exact section names from the <IndexTree> that needs to be modified for each change (not the original prompt, use the index tree for naming sections to edit). All section names are unique, so additional info on how to find the section isn't required. We need the exact section name to make changes effectively.
3. Name of the section needs to be from <IndexTree> provided.
4. Include all necessary changes to fully implement the feedback.
5. Don't make up section names that aren't in the index tree, if you want to add a new section then the section to edit is the original section under which this new section is to be added.
6. Do not include '<', '>' characters in the section names.

</InstructionsToFollow>
