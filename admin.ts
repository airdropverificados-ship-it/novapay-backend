export const SUPER_ADMIN_TELEGRAM_ID = '764290521';

export function isSuperAdmin(member) {
  if (!member) return false;
  return String(member.telegram_id) === SUPER_ADMIN_TELEGRAM_ID || member.is_admin === true;
}