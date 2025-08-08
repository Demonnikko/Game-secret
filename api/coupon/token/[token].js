// api/token/[id].js
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });

export default async function handler(req, res){
  const id = req.query.id;
  res.setHeader("content-type","text/html; charset=utf-8");
  if (!id) return res.status(400).send("Bad Request");

  try{
    await redis.connect();
    const key = `coupon:${id}`;
    const data = await redis.hgetall(key);

    if (!data || !data.status){
      return res.status(404).send(render("Купон не найден", `
        <p class="muted">Проверьте корректность QR-кода.</p>
      `));
    }

    if (data.status !== "active"){
      return res.status(200).send(render("Купон уже был применён", `
        <p class="muted">ID: <code>${id}</code></p>
        <p class="muted">Повторное использование невозможно.</p>
      `));
    }

    return res.status(200).send(render("Проверка купона", `
      <p>Приз: <b>${data.prize}</b></p>
      <p class="muted">ID: <code>${id}</code></p>
      <form method="post" action="/api/redeem" onsubmit="return confirm('Применить купон? Действие необратимо.')">
        <input type="hidden" name="id" value="${id}">
        <button class="btn-apply">Применить купон</button>
      </form>
      <script>
        // graceful POST (multipart/form-data не нужен)
        document.querySelector('form').addEventListener('submit', async (e)=>{
          e.preventDefault();
          const id = '${id}';
          const r = await fetch('/api/redeem', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({id})});
          if (r.ok){ location.reload(); } else { alert('Ошибка применения'); }
        });
      </script>
    `));

  }catch(e){
    console.error(e);
    return res.status(500).send(render("Ошибка сервера", `<p class="muted">Повторите попытку позже.</p>`));
  }finally{
    try{ await redis.quit(); }catch{}
  }
}

function render(title, inner){
  return `<!doctype html><html lang="ru"><head>
  <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — ШОУ СЕКРЕТ</title>
  <style>
    :root{--ink:#e9edf5;--bg:#000;--panel:#0b0b0f;--muted:#9aa3af;--gold:#ffcf76}
    html,body{margin:0;height:100%;background:#000;color:var(--ink);font:16px/1.5 Inter,system-ui,Roboto}
    .wrap{min-height:100%;display:grid;place-items:center;padding:20px}
    .box{background:#0b0b0f;border-radius:20px;padding:20px 22px;width:min(92vw,560px);text-align:center}
    h1{margin:0 0 10px;font-size:22px}
    .muted{color:var(--muted)}
    .btn-apply{appearance:none;border:0;border-radius:14px;padding:12px 18px;font-weight:800;cursor:pointer;
      background:linear-gradient(180deg,var(--gold),#e0b44f);color:#1a1207;box-shadow:0 10px 24px rgba(255,207,118,.2)}
    code{background:#111417;color:#e5e7eb;padding:2px 6px;border-radius:6px}
  </style></head><body>
  <div class="wrap"><div class="box">
    <h1>${title}</h1>
    ${inner}
  </div></div>
  </body></html>`;
}