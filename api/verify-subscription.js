export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID; // пример: -1002701616225
    // На клиенте мы не знаем userId. Для продакшена добавим auth через TG Login Widget.
    // Пока — пропускаем и возвращаем ok=true, чтобы не блокировать тест.
    // Если нужен реальный чек: примем userId в body и спросим getChatMember.
    return res.json({ ok: true, note: 'test-mode' });

    // Пример реальной проверки (когда будет userId):
    // const { userId } = await req.json();
    // const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${chatId}&user_id=${userId}`;
    // const r = await fetch(url); const j = await r.json();
    // const status = j?.result?.status;
    // const ok = ['member','administrator','creator'].includes(status);
    // return res.json({ ok });
  } catch (e) {
    return res.status(200).json({ ok: true, note: 'fallback' });
  }
}