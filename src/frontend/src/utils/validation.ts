export interface ProblemItem {
  sectionToEdit: string;
}

export interface SolutionItem {
  sectionToEdit: string;
  changeInstructions: string;
}

export function validatePrompt(prompt: string): boolean {
  if (!prompt || prompt.trim().length < 10) {
    return false;
  }
  return true;
}

export function validateFeedback(feedback: string): boolean {
  if (!feedback || feedback.trim().length < 10) {
    return false;
  }
  return true;
}

export function validateIndexTree(indexTree: string): boolean {
  try {
    const parsed = JSON.parse(indexTree);
    return !!parsed && typeof parsed === "object";
  } catch {
    return false;
  }
}

export function validateProblemList(plan: ProblemItem[]): boolean {
  if (!Array.isArray(plan)) return false;
  return plan.every(
    (item) => item.sectionToEdit && typeof item.sectionToEdit === "string"
  );
}

export function validateSolutionList(solutionList: SolutionItem[]): boolean {
  if (!Array.isArray(solutionList)) return false;
  return solutionList.every(
    (item) =>
      item.sectionToEdit &&
      item.changeInstructions &&
      typeof item.sectionToEdit === "string" &&
      typeof item.changeInstructions === "string"
  );
}
