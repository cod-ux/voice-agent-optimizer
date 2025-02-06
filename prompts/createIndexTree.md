I will provide an LLM-based voice agent’s prompt. You will create a hierarchical tree of all sections in the prompt, including section names and line ranges. Return only the hierarchical tree in JSON format, as shown in the example below. Do not include explanations or additional content.

---

## **Example JSON Output**

```json
[
  {
    "sectionName": "Root",
    "start": 1,
    "end": 800,
    "xmlHeading": true,
    "children": [
      {
        "sectionName": "RootCoreInstructions",
        "start": 1,
        "end": 5,
        "xmlHeading": false
      },
      {
        "sectionName": "CoreAgentConfiguration",
        "start": 6,
        "end": 50,
        "xmlHeading": true,
        "children": [
          {
            "sectionName": "CoreAgentConfigurationCoreInstructions",
            "start": 6,
            "end": 10,
            "xmlHeading": false
          },
          {
            "sectionName": "RoleDefinition",
            "start": 11,
            "end": 15,
            "xmlHeading": false
          },
          {
            "sectionName": "ResponseRules",
            "start": 16,
            "end": 30,
            "xmlHeading": false,
            "children": [
              {
                "sectionName": "ResponseRulesCoreInstructions",
                "start": 16,
                "end": 20,
                "xmlHeading": false
              },
              {
                "sectionName": "ToneGuidelines",
                "start": 21,
                "end": 25,
                "xmlHeading": false
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

## **Instructions**

1. **Section Names and Line Ranges**: Use section names and line ranges to structure the hierarchical tree.
2. **XML Heading Identification**: Set `xmlHeading` to `true` for XML-like sections and `false` for plain text.
3. **Parent Section Content Handling**:
   - If a section has both its own content (lines of text) and one or more child sections, move the content into a new child sub-section named {ParentSectionName}CoreInstructions.
   - If the parent has no child sections, leave the content under the parent as usual.
   - If the parent has subsections, the parent section should only contain those subsections (plus the new {ParentSectionName}CoreInstructions if there is content).
   - Example: If a section is named AgentPersona and has both content and children, create a sub-section named AgentPersonaCoreInstructions that contains the text lines, and keep the other children as siblings.
4. **CoreInstructions Section Creation**: If a section is more than 100 lines long and has subsections, but some content remains in the parent section without a subsection, create a subsection in the index tree for that content, named {ParentSectionName}CoreInstructions.
5. **Duplicate Handling**: Handle duplicate section names by adding a suffix to make them unique, like 'Restatement' or 'Repeated' or both if there are multiple duplicates. Section names in the index tree need to be unique.
6. **Include All Headings**: Include the lowest level of headings in the tree, even if they are not XML headings.
7. **Unique Section Names**: Ensure each section name is unique and matches exactly as mentioned in the <OriginalPrompt>, including spacing and formatting. Use PascalCase for section names without any special characters.
8. **Output Format**: Return only the JSON representation of the hierarchical tree.

---

## **Input**

<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

---

## **Output**

Return only the JSON representation of the hierarchical tree as specified in the example format. Do not include any additional text or explanations.
