{
  "changeListArray": [
    {
      "sectionToEdit": "CallFlow",
      "changeInstructions": "Modify the section where the prospect's email is acquired. The change should ensure that the voice agent waits for the prospect to spell out their email without interrupting, and confirms the email back to them.\n\nStep-by-step instructions:\n1. When the prospect starts spelling their email, the agent must give them enough time to finish spelling without interruptions. Insert a brief pause of 3 seconds (or silence, if applicable) each time a letter is communicated to ensure the agent doesn't inadvertently cut the prospect off.\n   \n2. Once the prospect finishes spelling their email, the agent must immediately repeat the spelled email address back to the prospect for confirmation. Use the sentence \"To confirm, you said your email is [spelled email], correct?\" to ensure clarity.\n\n3. If the prospect indicates any changes or corrections, repeat back the corrected version for final confirmation.\n\nAdd these instructions right after the original instruction to ask for the full email from start to finish, ensuring both listening and confirmation are consistently applied."
    },
    {
      "sectionToEdit": "AdditionalRules",
      "changeInstructions": "Add a rule to ensure that when acquiring information from the prospect, the agent must:\n\nStep-by-step instructions:\n1. Implement reinforcement prompts encouraging patience and focus on user input. For example, \"Please take your time, I value accuracy and want to ensure we have your details correct.\"\n\n2. Emphasize the importance of a clear dialog with the prospect by using positive reinforcement. Note that a satisfied prospect will lead to better reception of the call and services."
    },
    {
      "sectionToEdit": "ObjectionHandling",
      "changeInstructions": "In the subsection about repeating information, ensure the agent knows how to respond if the prospect seems unsure of what they hear from the agent.\n\nStep-by-step instructions:\n1. Use the response: \"No worries, I can repeat any part or spell anything out if necessary. I want to make sure everything is clear and accurate for our records.\"\n\n2. Encourage a back-and-forth where the prospect is comfortable correcting or clarifying details if needed."
    }
  ]
}