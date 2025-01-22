# Algorithm

Three step mechanism: Parse -> Filter -> Edit

Parse: We split the og Prompt into segments and categorise them;
Filter: We choose the segments from the whole prompt that is either causing bad behaviour or needs to be changed to incorporate good behaviour;
Edit: We remove, edit or add new lines to fit new behaviour or remove bad behaviour.

## Parsing

For this example we've used xml based structuring for the prompt, so we've hard coded parsing. Need to make this universally applicable for all styles in the future.

## Filtering

Problem: We were trying to add new questions to the call flow, ideally it should make changes only in call flow and maybe add one line in groundPrompt, but it's making chnages at more spots including template variables, and other general instructions too.

### Testing solution 1: Binary filtering

Use binary filtering with LLMs to choose the section to add new lines or remove lines.

#### Results:

-> 0/4 choices were correct.
-> 0% accuracy

Prompt gave section and feedback as context, asking to give 0 or 1 whether section needs to be modified to implement customer feedback.

### Testing solution 2: Semantic Similarity with minimal edits

#### Results:

-> With top 2 choices, 0/2, 0% accuracy.
-> With top 5 choices, 2/5, 40% accuracy. (For add new questions)

It's not going higher because, we're talking a lot about questions in both ground prompts too, so anywhere questionsa are spoken about are chosen for edits.

It also fails when giving info blandly like I dont want it to ask about target market, its putting of customers (0% accuracy).
-> For the target questions edit, 0/5, 0% accuracy (For remove target question)

### Testing solution 3: Top 10 with semSim and choose with o1 type model

(For remove target question)

-> Same 0% accuracy, because top 10 did not have call flow in it
-> When looping through all sections, again accuracy is ~0%.
