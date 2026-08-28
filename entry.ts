const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const DEFAULT_CAP = 15000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const members = await db.asServiceRole.entities.Member.filter({ created_by_id: user.id });
    const member = members && members[0];
    if (!member) return Response.json({ error: 'Miembro no encontrado' }, { status: 404 });

    const cfgList = await db.asServiceRole.entities.AppConfig.list();
    const cfg = cfgList && cfgList[0];
    if (cfg && cfg.chests_enabled === false) {
      return Response.json({ error: 'Los cofres están deshabilitados' }, { status: 403 });
    }
    const cap = (cfg && cfg.airdrop_cap_nvt) || DEFAULT_CAP;
    const claimed = member.airdrop_claimed_nvt || 0;
    if (claimed >= cap) {
      return Response.json({ error: 'Límite de airdrop alcanzado (' + cap + ' NVT)' }, { status: 403 });
    }

    const COOLDOWN = 3 * 3600 * 1000;
    const lastChest = member.last_chest_at ? new Date(member.last_chest_at).getTime() : 0;
    const elapsedChest = Date.now() - lastChest;
    if (lastChest && elapsedChest < COOLDOWN) {
      const remainingMin = Math.ceil((COOLDOWN - elapsedChest) / 60000);
      return Response.json({ error: 'Solo 1 cofre cada 3-4 horas. Próximo en ' + remainingMin + ' min.', cooldown: remainingMin }, { status: 403 });
    }

    let prize = 1 + Math.floor(Math.random() * 10);
    if (claimed + prize > cap) prize = Math.max(0, Math.floor(cap - claimed));
    if (prize <= 0) {
      return Response.json({ error: 'Límite de airdrop alcanzado' }, { status: 403 });
    }

    await db.asServiceRole.entities.Member.update(member.id, {
      nvt_balance: +((member.nvt_balance || 0) + prize).toFixed(8),
      airdrop_claimed_nvt: +(claimed + prize).toFixed(8),
      last_chest_at: new Date().toISOString(),
    });
    await db.asServiceRole.entities.Transaction.create({
      member_id: member.id,
      type: 'airdrop',
      from_currency: 'NVT',
      amount: prize,
      status: 'completed',
      description: 'Cofre del tesoro · ' + prize + ' NVT',
    });

    return Response.json({ ok: true, prize });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}