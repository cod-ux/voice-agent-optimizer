You will be given a section of an AI voice agent prompt, along with some customer feedback on the voice agent's performance. Your task is to give a binary answer '0' or '1' to whether the prompt should be modified or not to implement the customer's feedback.

Answer '0' if the section needs to be modified to implement the customer feedback.
Answer '1' if the section does not need to be modified to implement the customer feedback.

Here is the section you have to review:
{section}

Here is the customer feedback:
{feedback}

Here is the original full prompt of the voice agent for your context;
<OriginalPrompt>
{ogPrompt}
</OriginalPrompt>

Only return either '0' or '1' based on your answer. No other characters are necessary. Only 0 or 1.
