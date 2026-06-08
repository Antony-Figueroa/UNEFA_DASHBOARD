# Tasks: Mejora Módulo Perfil de Usuario

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1100-1300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (bugs+cleanup) → PR 2 (backend+DB) → PR 3 (frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

```
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

## Phase 1: Bug Fixes + Cleanup (PR 1 — ~250 lines)

- [x] 1.1 Add `isPassword={true}` to all 3 `<Input>` in `UserPasswordCard.tsx`
- [x] 1.2 Add `currentPassword` field + validation to `UserPasswordCard.tsx`
- [x] 1.3 Add `currentPassword` to `authService.changePassword()` call
- [x] 1.4 Validate `currentPassword` in `auth.controller.ts:changePassword`
- [x] 1.5 Add `authenticateToken` to `POST /auth/change-password` in `auth.routes.ts`
- [x] 1.6 Fix role mapping in `UserInfoCard.tsx` → `ROLE_LABELS[user.role]`
- [x] 1.7 Replace raw `fetch()` with `apiClient` in `UserLoginHistoryCard.tsx`
- [x] 1.8 Delete `UserAddressCard.tsx`
- [x] 1.9 Remove empty `<div></div>` from `UserProfiles.tsx`
- [x] 1.10 Only send login notification for new/unrecognized devices (not every login)

## Phase 2: DB Migrations + Backend (PR 2 — ~300 lines)

- [x] 2.1 Create `t_user_sessions` table migration
- [x] 2.2 Create `t_user_notification_prefs` table migration
- [x] 2.3 Add `LOCALE` column to `t_user`
- [x] 2.4 Add avatar upload/delete to `auth.service.ts` (presigned URL)
- [x] 2.5 Add session CRUD to `auth.service.ts`
- [x] 2.6 Add notification prefs CRUD to `auth.service.ts`
- [x] 2.7 Add account deactivation to `auth.service.ts`
- [x] 2.8 Add locale update to `auth.service.ts`
- [x] 2.9 Register all new routes in `auth.routes.ts`

## Phase 3: Frontend Infrastructure + New Components (PR 3 — ~600 lines)

- [x] 3.1 Create `src/features/auth/constants/roles.ts` (ROLE_LABELS)
- [x] 3.2 Create `src/features/auth/constants/profileValidation.ts` (Zod schemas)
- [x] 3.3 Extend `changePasswordSchema` in `firstLoginValidation.ts`
- [x] 3.4 Add `locale` to `AuthUser` in `src/context/auth.ts`
- [x] 3.5 Add new service methods to `authService.ts`
- [x] 3.6 Create `useLoginHistory` hook
- [x] 3.7 Create `useActiveSessions` hook
- [x] 3.8 Create `useNotificationPreferences` hook
- [x] 3.9 Create `useLocale` hook
- [x] 3.10 Rewrite `UserMetaCard.tsx` with RHF+Zod + avatar upload
- [x] 3.11 Rewrite `UserPasswordCard.tsx` with RHF+Zod + currentPassword
- [x] 3.12 Create `NotificationPreferencesCard.tsx`
- [x] 3.13 Create `ActiveSessionsCard.tsx`
- [x] 3.14 Create `AccountDangerZoneCard.tsx`
- [x] 3.15 Create `LanguagePreferencesCard.tsx`
- [x] 3.16 Wire all cards into `UserProfiles.tsx` layout
- [x] 3.17 Run `npm run build` and fix TS errors
