# Project memory

## Product intent & audience

- **LIVE RUSSIA GAMING**: a mobile-first gaming community portal for members and staff.
- Core sections: member dashboard, directory, leaderboard, Discord status center, Staff HQ, admin area.
- Uses clearly-labelled demo data only; no real database integration yet.
- Audience: community members and authorized staff/admins.

## Brand personality & voice

- Premium, community-oriented gaming identity; Russian-language naming/branding cues.

## Visual design & UX direction

- Premium black-and-gold theme throughout; must be preserved across all updates.
- Mobile-first and responsive, explicitly targeting Android mobile devices.
- Lucide React icons used for logos/UI (per `.bolt/prompt`).
- Patterns: clickable department cards opening side panels/drawers; modals for admin actions; member cards show role titles and online status.
- Avoid: rebuilding existing pages/features; modifying unrelated UI when adding staff changes.

## Decisions, constraints & rationale

- Stack: Vite + React + JSX + Tailwind CSS + Lucide React (no extra UI/icon packages unless explicitly requested).
- Path alias `@/` maps to `src/` (e.g. `@/components/Foo`); avoid deep relative imports.
- Staff HQ departments currently include: Junior Administrator, Moderation, Support Team, Loan Center Management. Loan Officer is a position under Loan Center Management.
- "Loans" department was renamed to "Loan Center Management"; code references updated accordingly (StaffPage, AdminPage StaffManagement).
- Data model (`types.ts`): departments are typed; members carry optional `staffRole`; demo members use IDs like `m-001`.
- Demo data lives in `demo.ts` (`staffDepartments`, `demoMembers`, `demoActivity`, etc.).
- Admin state/authorization handled via `AppContext`; admins get "Assign role" affordances on members.
- Role assignment modal offers department-appropriate roles (e.g. Loan Officer, Loan Center Manager, Support Lead).
- Existing pages/features are off-limits for removal or modification; only targeted, additive changes allowed.

## Open questions & assumptions

- Real database integration is pending; all staff/member data stays demo and clearly labelled until then.
- Admin authorization specifics (who counts as "authorized") are inferred from `AppContext`; exact admin roles/permissions not yet formalized.
- Staff department set is assumed fixed to the requested list for now; future department changes may need type updates.