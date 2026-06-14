## Admin Photo Flagging

### Database
- Create `admin_remove_photo(target_user_id, photo_url, reason)` RPC
  - Validates admin via `has_role`
  - Removes photo from `profiles.photos` array with `array_remove`
  - Clears `avatar_url` if it matches the flagged photo
  - Logs action to `flag_audit_log` with photo URL in reason
  - Resolves any pending `inappropriate_photo` reports for that user+photo

### Frontend — ProfileDetail.tsx
- Add admin-only "Flag Photo" button in the photo gallery area
- Show confirmation dialog before removal
- Call `admin_remove_photo` RPC, then refresh profile data
- Use destructive styling to distinguish from user "Report"

### Frontend — AdminDashboard.tsx (ModerationTab)
- For reports with `reason === "inappropriate_photo"` add a "Remove Photo" action
- Parse photo URL from `details` field and call `admin_remove_photo`
- Also update the report status to "resolved" after removal