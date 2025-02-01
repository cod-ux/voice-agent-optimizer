export interface ProblemItem {
  sectionToEdit: string;
}

export interface SolutionItem {
  sectionToEdit: string;
  howToEdit: string;
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
    return !!parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
}

export function validateProblemList(problemList: ProblemItem[]): boolean {
  if (!Array.isArray(problemList)) return false;
  return problemList.every(
    (item) =>
      item.sectionToEdit &&
      typeof item.sectionToEdit === 'string'
  );
}

export function validateSolutionList(solutionList: SolutionItem[]): boolean {
  if (!Array.isArray(solutionList)) return false;
  return solutionList.every(
    (item) =>
      item.sectionToEdit &&
      item.howToEdit &&
      typeof item.sectionToEdit === 'string' &&
      typeof item.howToEdit === 'string'
  );
}
