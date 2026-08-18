import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { StaffUser } from '../../types/auth';

export interface InvestmentMutationRequest {
  action: string;
  payload?: any;
  expectedVersion?: number;
  actorUid?: string; // Optional context, server authoritative auth overrides this
}

export interface InvestmentMutationResponse<T = any> {
  success: boolean;
  data?: T;
  deletedId?: string;
  count?: number;
  newVersion?: number;
  code?: string;
  error?: string;
}

export class InvestmentMutationError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 400) {
    super(message);
    this.name = 'InvestmentMutationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Executes a typed, server-authoritative investment mutation via Firebase HTTPS Callable Function.
 * Uses Firebase Functions SDK (`httpsCallable`), ensuring caller authentication is automatically
 * attached without manual header manipulation.
 */
export async function callInvestmentCallable<T = any>(
  action: string,
  payload?: any,
  expectedVersion?: number,
  actor?: StaffUser
): Promise<InvestmentMutationResponse<T>> {
  if (!functions) {
    throw new InvestmentMutationError(
      'Firebase Functions client is not initialized.',
      'FUNCTIONS_NOT_INITIALIZED',
      500
    );
  }

  const callable = httpsCallable<InvestmentMutationRequest, InvestmentMutationResponse<T>>(
    functions,
    'investmentMutate'
  );

  try {
    const res = await callable({
      action,
      payload,
      expectedVersion,
      actorUid: actor?.uid,
    });

    const result = res.data;
    if (result && !result.success && result.error) {
      throw new InvestmentMutationError(
        result.error,
        result.code || 'MUTATION_FAILED',
        result.code === 'VERSION_CONFLICT' ? 409 : 400
      );
    }

    return result;
  } catch (err: any) {
    if (err instanceof InvestmentMutationError) {
      throw err;
    }

    // Unpack HttpsError from Firebase Functions SDK
    const message = err.message || err.details?.message || 'Investment mutation failed';
    const code = err.details?.code || err.code || 'MUTATION_ERROR';
    const statusCode = code === 'VERSION_CONFLICT' || code === 'already-exists' ? 409 : 400;

    throw new InvestmentMutationError(message, code, statusCode);
  }
}
