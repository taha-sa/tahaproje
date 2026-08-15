export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel.' });
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Özetlenecek metin boş olamaz.' });
  }

  try {
    // En güncel kararlı Gemini 3.7 Flash modeli
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `Sen profesyonel bir editör ve analistsin. Aşağıdaki metni gereksiz hiçbir giriş, "tabii ki özetlerim" gibi dolgu cümleler veya yapay zeka klişeleri KULLANMADAN, doğrudan madde madde kısa, öz ve nokta atışı profesyonel bir özet haline getir:\n\n${text}` 
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Hatası:', data);
      return res.status(500).json({ error: data.error?.message || 'Gemini API yanıt vermedi.' });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Özet oluşturulamadı.';

    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Sunucu Hatası:', error);
    return res.status(500).json({ error: 'AI request failed.' });
  }
}
