// Common interfaces
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// JsonNode interface (moved from index.ts)
export interface JsonNode {
  sectionName: string;
  start: number;
  end: number;
  xmlHeading: boolean;
  children?: JsonNode[];
}

// Create Index Tree types
export interface CreateIndexTreeRequest {
  feedback: string;
  prompt: string;
}

export interface CreateIndexTreeResponse {
  indexTree: string;
}

// Create Change List types
export interface CreateChangeListRequest {
  prompt: string;
  indexTree: string;
  feedback: string;
}

export interface CreateChangeListResponse {
  changeList: string;
}

// Apply Changes types
export interface ApplyChangeRequest {
  change: Change;
  currentPrompt: string;
  currentIndexTree: string;
}

export interface ApplyChangeResponse {
  updatedPrompt: string;
  updatedIndexTree: string;
  result: ChangeResult;
}

// Change types
export interface Change {
  sectionToEdit: string;
  changeInstructions: string;
}

export interface ChangeResult {
  section: string;
  success: boolean;
  error?: string;
}

export interface ApplyChangeResult {
  updatedPrompt: string;
  updatedIndexTree: string;
  result: ChangeResult;
}
