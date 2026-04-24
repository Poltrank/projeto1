# Security Specification - Motorista Pro

## Data Invariants
1. A user can only access and modify their own data (profile and transactions).
2. Users can only be in the ranking if they explicitly opt-in (`rankingOptIn: true`).
3. Ranking entries are publicly readable but only writable by the owner if they align with their weekly totals (or updated via a trusted logic).
4. `weeklyTotal`, `monthlyTotal`, and `annualTotal` should ideally be derived but for a simple serverless app, we allow the client to update them with strict validation.
5. `name` is considered PII and should only be readable by the owner.

## The "Dirty Dozen" Payloads
1. Attempt to create a user profile with a different `auth.uid`.
2. Attempt to read another user's private transactions.
3. Attempt to update another user's nickname in the ranking.
4. Attempt to write an entry in the ranking without opting in first.
5. Attempt to set `weeklyTotal` to a negative number or extremely large value (Denial of Wallet).
6. Attempt to inject a 1MB string into the `car` field.
7. Attempt to delete another user's account.
8. Attempt to update `createdAt` field (immortality rule).
9. Attempt to create a transaction without a valid `userId` link.
10. Attempt to spoof a server timestamp for `updatedAt`.
11. Attempt to list all users (PII leak).
12. Attempt to update the `rankingEntry` for a user that hasn't signed in.

## Test Runner (Draft)
A `firestore.rules.test.ts` would verify these. For now, we focus on the rules implementation.
