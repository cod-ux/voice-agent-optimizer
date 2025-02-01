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
        "sectionName": "CoreAgentConfiguration",
        "start": 1,
        "end": 50,
        "xmlHeading": true,
        "children": [
          {
            "sectionName": "RoleDefinition",
            "start": 1,
            "end": 10,
            "xmlHeading": false
          },
          {
            "sectionName": "ResponseRules",
            "start": 11,
            "end": 30,
            "xmlHeading": false
          },
          {
            "sectionName": "HandlingObjections",
            "start": 31,
            "end": 50,
            "xmlHeading": false
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
3. **Duplicate Handling**: Handle duplicate section names by adding a suffix to make them unique, like 'Restatement' or 'Repeated' or both if there are multiple duplicates. Section names in the index tree need to be unique.
4. **Include All Headings**: Include the lowest level of headings in the tree, even if they are not XML headings.
5. **Unique Section Names**: Ensure each section name is unique and matches exactly as mentioned in the <OriginalPrompt>, including spacing and formatting. Use PascalCase for section names without any special characters.
6. **Output Format**: Return only the JSON representation of the hierarchical tree.

---

## **Input**

<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

---

## **Output**

Return only the JSON representation of the hierarchical tree as specified in the example format. Do not include any additional text or explanations.
