I will provide an LLM-based voice agent’s prompt. You will create a hierarchical tree of all sections in the prompt, including section names and line ranges. Return only the hierarchical tree in JSON format, as shown in the example below. Do not include explanations or additional content.

Example JSON Output:

<ExampleJSONFormat>
```json
[
{
  "sectionName": "Root (OriginalPrompt)",
  "start": 1,
  "end": 800,
  "xmlHeading": true,
  "children": [
    {
      "sectionName": "1.1. Core Agent Configuration",
      "start": 1,
      "end": 50,
      "xmlHeading": true,
      "children": [
        {
          "sectionName": "Role Definition",
          "start": 1,
          "end": 10,
          "xmlHeading": false
        },
        {
          "sectionName": "Response Format Rules",
          "start": 11,
          "end": 30,
          "xmlHeading": false
        },
        {
          "sectionName": "Pricing/Objection Handling Directives",
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
</ExampleJSONFormat>

Here is the original prompt:
<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

Instructions:

1. Use section names and line ranges to structure the hierarchical tree.
2. Include xmlHeading as true for XML-like sections and false for plain text.
3. Include the lowest level of headings in the tree even if its not an xml heading.
4. Each section name must be unique. Section name must be exactly the same as mentioned in the <OriginalPrompt>, even if it is missing spaces between words.
5. Return only the JSON representation of the hierarchical tree.
