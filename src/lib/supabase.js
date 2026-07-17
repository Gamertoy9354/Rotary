import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/** Upload an image to the public `media` bucket under the user's folder. */
export async function uploadImage(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

export const ROLE_LABELS = {
  visitor: 'Community Supporter',
  member: 'Club Member',
  officer: 'Club Officer',
  admin: 'Club President',
};
