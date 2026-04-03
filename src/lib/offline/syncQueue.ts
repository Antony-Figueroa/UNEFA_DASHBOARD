import { offlineDb } from './db';
import type { PendingMutation, MutationStatus } from './types';
import { OFFLINE_CONFIG, generateUUID } from './constants';

export async function queueMutation(
  mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retryCount' | 'status'>
): Promise<string> {
  const id = generateUUID();
  
  const pendingMutation: PendingMutation = {
    ...mutation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
    maxRetries: OFFLINE_CONFIG.MAX_RETRIES,
  };
  
  await offlineDb.mutations.add(pendingMutation);
  
  console.info(`[SyncQueue] Mutation queued: ${mutation.type} ${mutation.endpoint}`, {
    id,
    method: mutation.method,
  });
  
  return id;
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return offlineDb.getPendingMutations();
}

export async function getMutationById(id: string): Promise<PendingMutation | undefined> {
  return offlineDb.getMutationById(id);
}

export async function removeMutation(id: string): Promise<void> {
  await offlineDb.mutations.delete(id);
}

export async function updateMutationStatus(
  id: string,
  status: MutationStatus,
  error?: string
): Promise<void> {
  await offlineDb.mutations.update(id, { status, error });
}

export async function incrementRetryCount(id: string): Promise<number> {
  const mutation = await offlineDb.getMutationById(id);
  if (!mutation) return 0;
  
  const newRetryCount = mutation.retryCount + 1;
  await offlineDb.mutations.update(id, { retryCount: newRetryCount });
  
  return newRetryCount;
}

export async function clearCompletedMutations(): Promise<void> {
  await offlineDb.mutations.where('status').equals('completed').delete();
}

export async function getPendingCount(): Promise<number> {
  return offlineDb.mutations
    .where('status')
    .anyOf(['pending', 'failed'])
    .count();
}

export async function executeMutation(mutation: PendingMutation): Promise<boolean> {
  try {
    await updateMutationStatus(mutation.id, 'processing');
    
    const apiClient = (await import('../../api/apiClient')).default;
    
    let response;
    const payload = mutation.payload;
    
    switch (mutation.method) {
      case 'POST':
        response = await apiClient.post(mutation.endpoint, payload);
        break;
      case 'PUT':
        response = await apiClient.put(mutation.endpoint, payload);
        break;
      case 'PATCH':
        response = await apiClient.patch(mutation.endpoint, payload);
        break;
      case 'DELETE':
        response = await apiClient.delete(mutation.endpoint, { data: payload });
        break;
      default:
        throw new Error(`Unsupported method: ${mutation.method}`);
    }
    
    await offlineDb.syncLogs.add({
      id: generateUUID(),
      mutationId: mutation.id,
      status: 'success',
      timestamp: Date.now(),
      response: response?.data,
    });
    
    await removeMutation(mutation.id);
    
    console.info(`[SyncQueue] Mutation completed: ${mutation.type} ${mutation.endpoint}`);
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[SyncQueue] Mutation failed: ${mutation.type} ${mutation.endpoint}`, errorMessage);
    
    const retryCount = await incrementRetryCount(mutation.id);
    
    if (retryCount >= mutation.maxRetries) {
      await updateMutationStatus(mutation.id, 'failed', errorMessage);
    } else {
      await updateMutationStatus(mutation.id, 'pending', errorMessage);
    }
    
    return false;
  }
}

export async function hasPendingMutationForEndpoint(endpoint: string): Promise<boolean> {
  const mutation = await offlineDb.getMutationByEndpoint(endpoint);
  return !!mutation;
}
