export default async function handler(req, res) {
  // 1. Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. API Anahtarı kontrolü
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY Vercel ortam değişkenlerinde tanımlanmamış.' });
    }

    // 3. Metin kontrolü
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Özetlenecek metin boş olamaz.' });
    }

    // 4. Gemini API isteği (Kararlı sürüm)
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Aşağıdaki metni profesyonelce özetle, önemli maddeleri ve ana hatları net bir şekilde Türkçe olarak listele:\n\n${text}` }]
        }]
      })
    });

    const data = await apiResponse.json();

    // 5. API yanıt kontrolü
    if (!apiResponse.ok) {
      console.error('Gemini API Hatası:', data);
      return res.status(500).json({ error: data.error?.message || 'Gemini API başarısız yanıt döndürdü.' });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      return res.status(500).json({ error: 'Model içerik üretemedi veya yanıt döndürmedi.' });
    }

    return res.status(200).json({ summary });

  } catch (error) {
    console.error('Sunucu Çalışma Hatası:', error);
    return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}
