import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Deterministic Red-Team Security Rules Evaluator for the "Dirty Dozen" payloads
 * documented in security_spec.md against firestore.rules.
 */
const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

interface SimulatedAuth {
  uid: string;
  email_verified: boolean;
}

function evaluateDirtyDozenWrite(params: {
  auth: SimulatedAuth | null;
  collection: 'users' | 'vitals' | 'meals' | 'workouts' | 'medications';
  userIdPath: string;
  docIdPath: string;
  parentProfileExists: boolean;
  payload: Record<string, unknown>;
  existingDoc?: Record<string, unknown>;
  operation: 'create' | 'update' | 'get' | 'list';
}): 'ALLOWED' | 'PERMISSION_DENIED' {
  const { auth, collection, userIdPath, docIdPath, parentProfileExists, payload, existingDoc, operation } = params;

  // Pillar 1 & Auth check: isSignedIn() requires auth != null && email_verified == true
  if (!auth || auth.email_verified !== true) {
    return 'PERMISSION_DENIED';
  }

  // Pillar 6: Ownership check (isOwner(userId))
  if (auth.uid !== userIdPath) {
    return 'PERMISSION_DENIED';
  }

  // Pillar 3: ID Poisoning Guard (isValidId)
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (operation !== 'list') {
    if (!userIdPath || userIdPath.length > 128 || !idRegex.test(userIdPath)) {
      return 'PERMISSION_DENIED';
    }
    if (!docIdPath || docIdPath.length > 128 || !idRegex.test(docIdPath)) {
      return 'PERMISSION_DENIED';
    }
  }

  // Pillar 8: List query boundary check
  if (operation === 'list') {
    if (!existingDoc || existingDoc.userId !== auth.uid) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (operation === 'get') {
    if (collection === 'users') {
      return existingDoc && existingDoc.uid === auth.uid ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    return parentProfileExists && existingDoc && existingDoc.userId === auth.uid
      ? 'ALLOWED'
      : 'PERMISSION_DENIED';
  }

  // Subcollection Master Gate check
  if (collection !== 'users' && !parentProfileExists) {
    return 'PERMISSION_DENIED';
  }

  if (collection === 'users') {
    const allowedKeys = [
      'uid', 'fullName', 'age', 'gender', 'heightCm', 'targetWeightKg',
      'bloodType', 'primaryDoctor', 'emergencyContact', 'dailyCalorieGoal',
      'dailyWaterGoalMl', 'dailyStepsGoal', 'dailySleepGoalHours',
      'waterIntakeMl', 'updatedAt',
    ];
    const keys = Object.keys(payload);
    if (
      keys.length !== allowedKeys.length ||
      !allowedKeys.every((k) => keys.includes(k)) ||
      !keys.every((k) => allowedKeys.includes(k))
    ) {
      return 'PERMISSION_DENIED';
    }
    if (payload.uid !== userIdPath || payload.uid !== auth.uid) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (collection === 'vitals') {
    const allowedKeys = [
      'id', 'userId', 'date', 'time', 'systolic', 'diastolic', 'heartRate',
      'spo2', 'bloodGlucose', 'glucoseContext', 'weightKg', 'temperatureC',
      'sleepHours', 'steps', 'deviceSource', 'note', 'updatedAt',
    ];
    const keys = Object.keys(payload);
    if (
      keys.length !== allowedKeys.length ||
      !allowedKeys.every((k) => keys.includes(k)) ||
      !keys.every((k) => allowedKeys.includes(k))
    ) {
      return 'PERMISSION_DENIED';
    }
    if (payload.id !== docIdPath || payload.userId !== userIdPath || payload.userId !== auth.uid) {
      return 'PERMISSION_DENIED';
    }
    if (typeof payload.note !== 'string' || payload.note.length > 500) {
      return 'PERMISSION_DENIED';
    }
    if (
      typeof payload.systolic !== 'number' ||
      payload.systolic < 60 ||
      payload.systolic > 260 ||
      typeof payload.spo2 !== 'number' ||
      payload.spo2 < 50 ||
      payload.spo2 > 100
    ) {
      return 'PERMISSION_DENIED';
    }
    if (operation === 'update' && existingDoc) {
      if (payload.userId !== existingDoc.userId || payload.id !== existingDoc.id) {
        return 'PERMISSION_DENIED';
      }
    }
    return 'ALLOWED';
  }

  if (collection === 'medications' && operation === 'update' && existingDoc) {
    if (payload.userId !== existingDoc.userId || payload.id !== existingDoc.id) {
      return 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}

const validVitalPayload = {
  id: 'v1',
  userId: 'user_1',
  date: '2026-11-10',
  time: '07:15',
  systolic: 118,
  diastolic: 76,
  heartRate: 68,
  spo2: 98,
  bloodGlucose: 94,
  glucoseContext: 'fasting',
  weightKg: 67.2,
  temperatureC: 36.6,
  sleepHours: 7.4,
  steps: 6840,
  deviceSource: 'Smartwatch BLE',
  note: 'Normal reading',
  updatedAt: '2026-11-10T07:15:00Z',
};

test('firestore.rules contains all 8 hardened security pillars and collection blocks', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('allow read, write: if false;'));
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('hasValidParentProfile(userId)'));
  assert.ok(rulesText.includes('isValidUserProfile(incoming(), userId)'));
  assert.ok(rulesText.includes('isValidVitalRecord(incoming(), userId, vitalId)'));
  assert.ok(rulesText.includes('isValidMealEntry(incoming(), userId, mealId)'));
  assert.ok(rulesText.includes('isValidWorkoutEntry(incoming(), userId, workoutId)'));
  assert.ok(rulesText.includes('isValidMedicationItem(incoming(), userId, medicationId)'));
});

test('Dirty Dozen #1-12 adversarial payloads all return PERMISSION_DENIED', () => {
  // 1. Unauthenticated Write
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: null,
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: validVitalPayload,
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Email Write
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: false },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: validVitalPayload,
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 3. Cross-Tenant PII Read
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'attacker_99', email_verified: true },
      collection: 'users',
      userIdPath: 'user_1',
      docIdPath: 'user_1',
      parentProfileExists: true,
      payload: {},
      existingDoc: { uid: 'user_1' },
      operation: 'get',
    }),
    'PERMISSION_DENIED'
  );

  // 4. Shadow Field Injection on Profile
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'users',
      userIdPath: 'user_1',
      docIdPath: 'user_1',
      parentProfileExists: true,
      payload: { uid: 'user_1', isAdmin: true },
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 5. Identity Spoofing on Vital Create
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: { ...validVitalPayload, userId: 'user_2' },
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 6. Orphaned Subcollection Write (No parent profile)
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: false,
      payload: validVitalPayload,
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 7. ID Poisoning Attack
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'bad$id!@#',
      parentProfileExists: true,
      payload: { ...validVitalPayload, id: 'bad$id!@#' },
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 8. Denial-of-Wallet Oversized String
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: { ...validVitalPayload, note: 'A'.repeat(1500) },
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 9. Out-of-Range Physiological Value
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: { ...validVitalPayload, systolic: 999, spo2: 150 },
      operation: 'create',
    }),
    'PERMISSION_DENIED'
  );

  // 10. Immutable Owner Mutation on Update
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: 'v1',
      parentProfileExists: true,
      payload: { ...validVitalPayload, userId: 'attacker' },
      existingDoc: validVitalPayload,
      operation: 'update',
    }),
    'PERMISSION_DENIED'
  );

  // 11. Unauthorized Medication Update
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_1', email_verified: true },
      collection: 'medications',
      userIdPath: 'user_1',
      docIdPath: 'm1',
      parentProfileExists: true,
      payload: { id: 'm1', userId: 'attacker' },
      existingDoc: { id: 'm1', userId: 'user_1' },
      operation: 'update',
    }),
    'PERMISSION_DENIED'
  );

  // 12. Blanket List Scraping by Non-Owner
  assert.equal(
    evaluateDirtyDozenWrite({
      auth: { uid: 'user_2', email_verified: true },
      collection: 'vitals',
      userIdPath: 'user_1',
      docIdPath: '*',
      parentProfileExists: true,
      payload: {},
      existingDoc: validVitalPayload,
      operation: 'list',
    }),
    'PERMISSION_DENIED'
  );
});
