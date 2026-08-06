import { MediaAsset } from '../types/media';

// In-memory fallback cache for processed media assets and variants
export interface LocalMediaStore {
  assets: Map<string, MediaAsset>;
  variants: Map<string, any>;
}

export const localMediaStore: LocalMediaStore = {
  assets: new Map(),
  variants: new Map(),
};

export interface LocalStagingStore {
  stagingBuffers: Map<string, { buffer: any; fileName: string; contentType: string }>;
}

export const localStagingStore: LocalStagingStore = {
  stagingBuffers: new Map(),
};
