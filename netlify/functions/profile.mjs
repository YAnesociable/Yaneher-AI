/** Authenticated identity changes. IP comes only from Netlify's trusted connection context.
 * Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PROFILE_IP_SECRET.
 * Apply db/v12_3_profile.sql. Service key and IP hash secret stay server-side.
 */
import { createHmac } from 'node:crypto';
const json = (value,status=200,extra={}) => new Response(JSON.stringify(value), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
export default async function handler(request, context={}) {
  if (!['GET','POST'].includes(request.method)) return json({error:'Метод не поддерживается'},405,{allow:'GET, POST'});
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/,''), anon=process.env.SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY, secret=process.env.PROFILE_IP_SECRET;
  if (!/^https:\/\/[^\s]+$/.test(base) || !anon || !service || !secret) return json({error:'Сервер профиля не настроен. Добавьте переменные окружения и миграцию v12.3.'},503);
  const auth = request.headers.get('authorization') || '';
  if (!/^Bearer [A-Za-z0-9_.-]{20,}$/.test(auth)) return json({error:'Для изменения профиля войди в аккаунт'},401);
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== new URL(request.url).host) return json({error:'Недопустимый Origin'},403); } catch { return json({error:'Недопустимый Origin'},403); } }
  const ip = context.ip || request.headers.get('x-nf-client-connection-ip');
  // x-forwarded-for and any client-submitted IP are intentionally ignored.
  if (!ip || !/^[a-fA-F0-9:.]{3,64}$/.test(ip)) return json({error:'Не удалось определить адрес подключения'},503);
  const hash = createHmac('sha256',secret).update(ip.toLowerCase()).digest('hex');
  try {
    const userRes = await fetch(base+'/auth/v1/user', {headers:{apikey:anon,Authorization:auth},signal:AbortSignal.timeout(8000)});
    const user = await userRes.json().catch(()=>null);
    if (!userRes.ok || !user?.id) return json({error:'Сессия истекла. Войди снова.'},401);
    let body = {};
    if (request.method === 'POST') {
      const raw = await request.text();
      if (raw.length > 182000) return json({error:'Изображение слишком большое'},413);
      try { body=JSON.parse(raw); } catch { return json({error:'Неверный формат запроса'},400); }
      if (!['avatar','nickname'].includes(body?.action) || typeof body.value !== 'string') return json({error:'Неверное изменение профиля'},400);
      if (body.action === 'avatar' && (body.value.length>180000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.value))) return json({error:'Выбери изображение JPEG, PNG или WebP'},400);
      if (body.action === 'nickname' && !/^[a-zA-Z0-9_]{3,24}$/.test(body.value)) return json({error:'Ник: 3–24 символа, A-Z, 0-9, _'},400);
    }
    const args = {target_user:user.id,trusted_ip_hash:hash};
    if (request.method === 'POST') Object.assign(args,{change_kind:body.action,change_value:body.value});
    const result = await fetch(base+'/rest/v1/rpc/'+(request.method==='GET'?'v123_profile_status':'v123_profile_mutate'), {
      method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'content-type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)
    });
    const data = await result.json().catch(()=>null);
    if (!result.ok) {
      if (data?.code === '23505') return json({error:'Этот никнейм уже занят'},409);
      if (/SANCTION:|заблок|запрещ/i.test(data?.message || '')) return json({error:String(data.message).replace(/^SANCTION:\s*/, '').slice(0,250)},403);
      return json({error:result.status===404?'Установите миграцию профиля v12.3.':'Не удалось сохранить профиль. Проверь данные и настройку сервера.'},result.status===404?503:400);
    }
    if (data?.ok===false && data.retryAfter) return json({error:body.action==='avatar'?'Изменение аватарки временно недоступно':'Изменение никнейма временно недоступно',retryAfter:data.retryAfter},429,{'retry-after':String(data.retryAfter)});
    return json(data);
  } catch { return json({error:'Сервер профиля временно недоступен. Повтори позже.'},503); }
}
export const config = { path: '/api/profile' };
