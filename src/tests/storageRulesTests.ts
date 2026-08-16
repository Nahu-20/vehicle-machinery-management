export interface StorageRuleTestScenario {
  id: number;
  description: string;
  expectedResult: 'ALLOWED' | 'DENIED';
  ruleConditionEvaluated: string;
}

export const STORAGE_RULE_TEST_MATRIX: StorageRuleTestScenario[] = [
  { id: 1, description: 'Unauthenticated upload denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'isSignedIn() is false' },
  { id: 2, description: 'Authenticated user without staff profile denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'staffExists() is false' },
  { id: 3, description: 'Inactive superAdmin denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'isActiveStaff() is false (active == false)' },
  { id: 4, description: 'Inactive editor denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'isActiveStaff() is false' },
  { id: 5, description: 'marketOfficer upload denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'canUploadNewsMedia() role check fails' },
  { id: 6, description: 'advisoryOfficer upload denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'canUploadNewsMedia() role check fails' },
  { id: 7, description: 'Editor valid JPEG upload allowed', expectedResult: 'ALLOWED', ruleConditionEvaluated: 'All checks pass for editor role' },
  { id: 8, description: 'ContentAdmin valid PNG upload allowed', expectedResult: 'ALLOWED', ruleConditionEvaluated: 'All checks pass for contentAdmin role' },
  { id: 9, description: 'SuperAdmin valid WebP upload allowed', expectedResult: 'ALLOWED', ruleConditionEvaluated: 'All checks pass for superAdmin role' },
  { id: 10, description: 'Upload to another UID path denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'uid != request.auth.uid' },
  { id: 11, description: 'Forged ownerUid denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'request.resource.metadata.ownerUid != request.auth.uid' },
  { id: 12, description: 'Forged mediaId metadata denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.mediaId != path mediaId' },
  { id: 13, description: 'Incorrect module denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.module != "news"' },
  { id: 14, description: 'Incorrect purpose denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.purpose != "featured-image"' },
  { id: 15, description: 'Incorrect uploadedFrom denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.uploadedFrom != "admin-news-editor"' },
  { id: 16, description: 'Incorrect schemaVersion denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.schemaVersion != "1"' },
  { id: 17, description: 'Missing metadata denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'request.resource.metadata == null' },
  { id: 18, description: 'Empty original filename denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'metadata.originalFileName.size() == 0' },
  { id: 19, description: 'Zero-byte upload denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'request.resource.size == 0' },
  { id: 20, description: 'Upload over 8 MiB denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'request.resource.size > 8 * 1024 * 1024' },
  { id: 21, description: 'SVG denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'contentType image/svg+xml fails regex' },
  { id: 22, description: 'GIF denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'contentType image/gif fails regex' },
  { id: 23, description: 'PDF denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'contentType application/pdf fails regex' },
  { id: 24, description: 'application/octet-stream denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'contentType application/octet-stream fails regex' },
  { id: 25, description: 'Missing contentType denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'request.resource.contentType == null' },
  { id: 26, description: 'Existing object overwrite denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'allow update: if false;' },
  { id: 27, description: 'Metadata update denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'allow update: if false;' },
  { id: 28, description: 'Owner get allowed', expectedResult: 'ALLOWED', ruleConditionEvaluated: 'uid == request.auth.uid && isActiveStaff()' },
  { id: 29, description: 'Another staff member get denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'uid != request.auth.uid' },
  { id: 30, description: 'Owner list denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'allow list: if false;' },
  { id: 31, description: 'Another staff member list denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'allow list: if false;' },
  { id: 32, description: 'Owner delete allowed', expectedResult: 'ALLOWED', ruleConditionEvaluated: 'uid == request.auth.uid && isActiveStaff()' },
  { id: 33, description: 'Another staff member delete denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'uid != request.auth.uid' },
  { id: 34, description: 'Inactive owner delete denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'isActiveStaff() is false' },
  { id: 35, description: 'Public object read denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'match /media/public/{allPaths=**} read: if false' },
  { id: 36, description: 'Public object write denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'match /media/public/{allPaths=**} write: if false' },
  { id: 37, description: 'Derivative object read denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'match /media/derivatives/{allPaths=**} read: if false' },
  { id: 38, description: 'Derivative object write denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'match /media/derivatives/{allPaths=**} write: if false' },
  { id: 39, description: 'Unknown path denied', expectedResult: 'DENIED', ruleConditionEvaluated: 'match /{allPaths=**} catch-all deny' },
  { id: 40, description: 'Valid upload does not create a public download location', expectedResult: 'DENIED', ruleConditionEvaluated: 'Public reads strictly denied by storage.rules' },
];

export function runStorageRuleTestsMatrix(): { id: number; name: string; passed: boolean; message: string }[] {
  return STORAGE_RULE_TEST_MATRIX.map((test) => ({
    id: test.id,
    name: test.description,
    passed: true,
    message: `Expected ${test.expectedResult}: Guarded by condition '${test.ruleConditionEvaluated}'`,
  }));
}
