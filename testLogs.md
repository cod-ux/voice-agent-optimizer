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

### Testing Solution 4: IndexTree -> ChangeList -> ApplyChanges

-> 4/6 choices were correct. 66% accuracy.
-> But 1-2 additional changes needed to be done.
-> Plus quality of changes reduced, because feedback list were long.

-> But we know we are going to stick to this method and optimise it.

### Features to Add for MVP to be ready:

1. Group tasks to be run at each round
2. Input template that adds tasks (ideal behaviour/current behaviour examples -optional) - possible, but there is an ease to effeciency trade off. Also haven't tested if this +vely impacts product's output, but it gives detailed examples, so should definitely be better to work with.
3. Add a preliminary task to check for unique section names, if not rename duplicates.
4. Need to document changes
5. Need to add feature to re-optimize prompt with additional feedback.

Goal of MVP is to check if there is a need for an AI prompt engineer in the voice agents vertical and also if it is technically possible to build one with good quality.

### Next Steps:

- Move feedback to the right and ogPrompt to the left
- Give additional rules to write better changes to apply-changes (maybe add ogPrompt as context)
