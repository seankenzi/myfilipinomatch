---
name: Account Deletion
description: User-initiated deletions require admin approval (no auto-purge)
type: feature
---
Account deletions are NOT automatic. When a user requests deletion from Settings:
1. A row is inserted into `account_deletions` with `status='pending'`.
2. The user is signed out and sees a banner stating the request is awaiting admin approval.
3. The user can cancel the request anytime before approval (sets status to `cancelled`).
4. An admin must explicitly click "Approve & Delete" in the Admin Dashboard → Deletions tab to finalize. This invokes the `admin-delete-user` edge function, which cascades the user's data and marks the existing pending row as `completed`.

The `process-account-deletions` edge function is intentionally a no-op (previously a 24h auto-purge cron). The pg_cron schedule has been removed.
