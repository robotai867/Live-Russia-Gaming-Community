import { supabase } from '@/lib/supabase';

export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      link: link || null,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to send:', err);
  }
}

export async function notifyRole(
  role: string,
  type: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  try {
    const { data: users } = await supabase
      .from('profiles')
      .select('id');
    if (!users) return;
    for (const u of users) {
      await sendNotification(u.id, type, title, body, link);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to notify role:', err);
  }
}
