// api/mint.js
import QRCode from "qrcode";
import Redis from "ioredis";

// Redis
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });

function absUrl(req, path){
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = (req.headers.get("x-forwarded-proto") || "https");
  return `${proto}://${host}${path.startsWith("/")?"":"/"}${path}`;
}

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const { prize } = req.body || {};
    if (!prize) return res.status(400).json({error:"prize required"});

    await redis.connect();

    // простой id
    const id = Math.random().toString(36).slice(2,10)+Date.now().toString(36);

    // сохраняем купон (60 дней TTL, можно менять)
    const key = `coupon:${id}`;
    await redis.hset(key, { status:"active", prize, created: Date.now().toString() });
    await redis.expire(key, 60*24*60*60); // 60 дней

    const redeemUrl = absUrl(req, `/api/token/${id}`);

    // генерим QR
    const qrDataUrl = await QRCode.toDataURL(redeemUrl, { width: 640, margin: 1 });

    res.status(200).json({ id, prize, redeemUrl, qrDataUrl });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"server"});
  }finally{
    try{ await redis.quit(); }catch{}
  }
}