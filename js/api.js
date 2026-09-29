const API_BASE=(window.EVARA_API_BASE||'/api').replace(/\/$/,'');
export async function api(path,options={}){
  const token=localStorage.getItem('evara_access_token');
  const response=await fetch(API_BASE+path,{
    ...options,
    headers:{
      'Content-Type':'application/json',
      ...(token?{Authorization:`Bearer ${token}`}:{}),
      ...(options.headers||{})
    }
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload.error||'Request failed');
  return payload;
}
export function saveSession(session){
  if(session?.access_token) localStorage.setItem('evara_access_token',session.access_token);
  if(session?.refresh_token) localStorage.setItem('evara_refresh_token',session.refresh_token);
}
export function clearSession(){
  localStorage.removeItem('evara_access_token');
  localStorage.removeItem('evara_refresh_token');
}
