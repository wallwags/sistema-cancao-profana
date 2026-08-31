import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const h = headers();
    const host = (h.get('x-forwarded-host') || h.get('host') || 'localhost:3000');
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzsbyfxcefmlclagoyii.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HN7YVIWVNC08pjgKnGzsLg_sMlUMKSK'
    );
    const { data } = await supabase.rpc('get_home_mode');
    redirect(data === 'vip' ? '/grupovip' : '/v2');
  } catch {
    redirect('/v2');
  }
}
