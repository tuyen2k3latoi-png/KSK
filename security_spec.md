# Security Specification — VitaPulse Personal Health Tracking System

## 1. Data Invariants
1. **Strict Ownership Isolation (PII & PHI Protection)**: Every document under `/users/{userId}` and its subcollections (`vitals`, `meals`, `workouts`, `medications`) contains Protected Health Information (PHI) and Personally Identifiable Information (PII). Only the authenticated, email-verified user whose `request.auth.uid == userId` can read, list, create, update, or delete those documents.
2. **Master Gate Relational Sync**: Every subcollection document (`vitals/{vitalId}`, `meals/{mealId}`, `workouts/{workoutId}`, `medications/{medicationId}`) must belong to an existing `/users/{userId}` parent document owned by `request.auth.uid` (`get(/databases/$(database)/documents/users/$(userId)).data.uid == request.auth.uid`), and its internal `userId` field must equal `request.auth.uid` and `userId`.
3. **Immutable Ownership Fields**: `uid` on `UserProfile` and `id` / `userId` on subcollection records cannot be modified during `update`.
4. **Strict Key & Size Enforcement**: Every create/update validates exact allowed keys via `hasAll` and `hasOnly`, enforces physiological numeric boundaries, and caps string lengths and ID patterns (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)
1. **Unauthenticated Write**: `auth = null`, creating `/users/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth = { uid: 'user_1', token: { email_verified: false } }`, creating `/users/user_1` -> `PERMISSION_DENIED`.
3. **Cross-Tenant PII Read**: `auth = { uid: 'attacker_99', token: { email_verified: true } }`, reading `/users/user_1` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Profile**: Adding `"isAdmin": true` to `/users/user_1` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Vital Create**: `auth.uid = 'user_1'`, writing `/users/user_1/vitals/v1` with `userId: 'user_2'` -> `PERMISSION_DENIED`.
6. **Orphaned Subcollection Write**: `auth.uid = 'user_no_profile'`, writing `/users/user_no_profile/vitals/v1` when `/users/user_no_profile` does not exist -> `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: Creating `/users/user_1/vitals/invalid$id!@#` -> `PERMISSION_DENIED`.
8. **Denial-of-Wallet Oversized String**: Creating `/users/user_1/vitals/v1` with a 2,000-character `note` (limit 500) -> `PERMISSION_DENIED`.
9. **Out-of-Range Physiological Value**: Creating `/users/user_1/vitals/v1` with `systolic: 999` or `spo2: 150` -> `PERMISSION_DENIED`.
10. **Immutable Owner Mutation on Update**: Updating `/users/user_1/vitals/v1` to change `userId` to `'attacker'` -> `PERMISSION_DENIED`.
11. **Unauthorized Update Key on Medication**: Updating `/users/user_1/medications/m1` to mutate `name` via an adherence-only update -> `PERMISSION_DENIED`.
12. **Blanket List Scraping**: Listing `/users/user_1/vitals` as `auth.uid = 'user_2'` -> `PERMISSION_DENIED`.
