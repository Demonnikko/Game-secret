// api/redeem.js
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  const { id } = req.body || {};
  if (!id) return res.status(400).json({error:"id required"});

  try{
    await redis.connect();
    const key = `coupon:${id}`;
    const exists = await redis.exists(key);
    if (!exists) return res.status(404).json({error:"not_found"});

    const status = await redis.hget(key, "status");
    if (status !== "active") return res.status(409).json({error:"already_redeemed"});

    await redis.hset(key, { status:"used", usedAt: Date.now().toString() });
    return res.status(200).json({ok:true});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"server"});
  }finally{
    try{ await redis.quit(); }catch{}
  }
}