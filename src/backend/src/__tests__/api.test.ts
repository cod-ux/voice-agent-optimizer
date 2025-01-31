import axios from 'axios';
import { 
  CreateIndexTreeRequest,
  CreateChangeListRequest,
  ApplyChangeRequest,
  JsonNode,
  Change
} from '../types';

const API_URL = 'http://localhost:3001';
jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('Voice Agent Optimizer API Tests', () => {
  // Sample data
  const sampleFeedback = "The tone should be more professional in the introduction section.";
  const sampleOgPrompt = `# Introduction
Hello! This is a casual intro.

# Main Content
This is the main content.

# Conclusion
This is the end.`;

  let indexTree: string;
  let changeList: string;

  // Test the complete flow
  test('complete flow: create index tree -> create change list -> apply change', async () => {
    // Step 1: Create index tree
    const createIndexTreeRequest: CreateIndexTreeRequest = {
      feedback: sampleFeedback,
      prompt: sampleOgPrompt
    };

    const indexTreeResponse = await axios.post(`${API_URL}/api/create-index-tree`, createIndexTreeRequest);
    expect(indexTreeResponse.status).toBe(200);
    expect(indexTreeResponse.data.success).toBe(true);
    expect(indexTreeResponse.data.data.indexTree).toBeDefined();
    
    indexTree = indexTreeResponse.data.data.indexTree;

    // Step 2: Create change list
    const createChangeListRequest: CreateChangeListRequest = {
      prompt: sampleOgPrompt,
      indexTree: indexTree,
      feedback: sampleFeedback
    };

    const changeListResponse = await axios.post(`${API_URL}/api/create-change-list`, createChangeListRequest);
    expect(changeListResponse.status).toBe(200);
    expect(changeListResponse.data.success).toBe(true);
    expect(changeListResponse.data.data.changeList).toBeDefined();

    changeList = changeListResponse.data.data.changeList;

    // Step 3: Apply a single change
    const changes = JSON.parse(changeList).changeListArray;
    const singleChange: Change = changes[0];

    const applyChangeRequest: ApplyChangeRequest = {
      change: singleChange,
      currentPrompt: sampleOgPrompt,
      currentIndexTree: indexTree
    };

    const applyChangeResponse = await axios.post(`${API_URL}/api/apply-changes`, applyChangeRequest);
    
    // Add debug logging
    console.log('Apply Change Response:', JSON.stringify(applyChangeResponse.data, null, 2));
    
    expect(applyChangeResponse.status).toBe(200);
    expect(applyChangeResponse.data.success).toBe(true);
    expect(applyChangeResponse.data.data.updatedPrompt).toBeDefined();
    expect(applyChangeResponse.data.data.updatedIndexTree).toBeDefined();
    expect(applyChangeResponse.data.data.result.success).toBe(true);
  });

  // Test error cases
  describe('Error Cases', () => {
    test('should handle missing parameters in create-index-tree', async () => {
      const requestData = {
        feedback: sampleFeedback
        // missing ogPrompt
      };

      try {
        await axios.post(`${API_URL}/api/create-index-tree`, requestData);
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBeDefined();
      }
    });

    test('should handle missing parameters in create-change-list', async () => {
      const requestData = {
        ogPrompt: sampleOgPrompt
        // missing indexTree
      };

      try {
        await axios.post(`${API_URL}/api/create-change-list`, requestData);
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBeDefined();
      }
    });

    test('should handle missing parameters in apply-change', async () => {
      const requestData = {
        currentPrompt: sampleOgPrompt,
        currentIndexTree: indexTree
        // missing change
      };

      try {
        await axios.post(`${API_URL}/api/apply-changes`, requestData);
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBeDefined();
      }
    });
  });
});
