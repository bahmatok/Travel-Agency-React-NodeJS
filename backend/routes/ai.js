const express = require('express');
const axios = require('axios');
const { HfInference, InferenceClient } = require('@huggingface/inference');
const auth = require('../middleware/auth');
const Tour = require('../models/Tour');

const router = express.Router();

// ======================
//      AI CHAT CLIENT
// ======================
async function aiChat(prompt) {
  const aiType = process.env.AI_API_TYPE || 'huggingface';
  
  // Hugging Face API для текстовых рекомендаций
  if (aiType === 'huggingface') {
    const hfModel = process.env.HUGGINGFACE_MODEL || "deepseek-ai/DeepSeek-V3.2";
    const hfProvider = process.env.HUGGINGFACE_PROVIDER || "novita"; // novita или fireworks
    
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not configured");
    }
    
    try {
      let generatedText = '';
      
      // Для DeepSeek-V3.2 используем InferenceClient с провайдером
      if (hfModel.includes('DeepSeek')) {
        const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
        const modelWithProvider = `${hfModel}:${hfProvider}`;
        
        const chatCompletion = await client.chatCompletion({
          model: modelWithProvider,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
          temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7")
        });
        
        generatedText = chatCompletion.choices[0]?.message?.content || '';
      } else {
        // Для других моделей используем прямой запрос к Inference API
        const hfApiUrl = `https://api-inference.huggingface.co/models/${hfModel}`;
        
        let formattedPrompt = prompt;
        // Для некоторых моделей нужен специальный формат
        if (hfModel.includes('MeowGPT') || (hfModel.includes('Instruct') && !hfModel.includes('DeepSeek'))) {
          formattedPrompt = `<s>[INST] ${prompt} [/INST]`;
        }
        
        const response = await axios.post(
          hfApiUrl,
          {
            inputs: formattedPrompt,
            parameters: {
              max_new_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
              temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
              return_full_text: false,
              do_sample: true
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 60000
          }
        );
        
        // Обработка ответа
        if (Array.isArray(response.data)) {
          const firstItem = response.data[0];
          if (typeof firstItem === 'string') {
            generatedText = firstItem;
          } else if (firstItem?.generated_text) {
            generatedText = firstItem.generated_text;
          } else {
            generatedText = JSON.stringify(firstItem);
          }
        } else if (response.data.generated_text) {
          generatedText = response.data.generated_text;
        } else if (typeof response.data === 'string') {
          generatedText = response.data;
        } else {
          generatedText = JSON.stringify(response.data);
        }
        
        // Очищаем форматирование, если есть
        if (generatedText.includes('[/INST]')) {
          generatedText = generatedText.split('[/INST]')[1] || generatedText;
        }
      }
      
      // Очищаем DeepSeek форматирование, если есть
      if (generatedText.includes('<|redacted_')) {
        generatedText = generatedText.replace(/<\|redacted_[^>]*>/g, '').trim();
      }
      // Очищаем другие возможные токены DeepSeek
      if (generatedText.includes('<|')) {
        generatedText = generatedText.replace(/<\|[^>]*>/g, '').trim();
      }
      generatedText = generatedText.trim();
      
      return generatedText;
    } catch (err) {
      // Обработка ошибок для InferenceClient и прямых запросов
      // Улучшенная обработка ошибок с детальным логированием
      if (err.response) {
        // Если модель загружается, ждем и повторяем
        if (err.response.status === 503 && err.response.data?.estimated_time) {
          const waitTime = err.response.data.estimated_time * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
          return aiChat(prompt);
        }
        // Детальная информация об ошибке
        const errorDetails = {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          message: err.message,
          model: hfModel
        };
        throw new Error(`Hugging Face API error: ${JSON.stringify(errorDetails, null, 2)}`);
      }
      // Ошибка без response (сетевая ошибка, таймаут и т.д.)
      throw new Error(`Hugging Face request failed: ${err.message} (Model: ${hfModel})`);
    }
  }
  
  // POE API (по умолчанию)
  const poeApiUrl =
    process.env.POE_API_URL || "https://api.poe.com/v1/chat/completions";

  const response = await axios.post(
    poeApiUrl,
    {
      model: process.env.POE_MODEL || "gpt-4o-mini",
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.POE_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000
    }
  );

  return response.data.choices[0].message.content;
}

// ======================
//     PLACES AI
// ======================
router.post('/places', auth, async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Простой промпт в одну строку с префиксом "рекомендации, куда сходить в"
    const fullPrompt = `рекомендации, куда сходить в ${location}. Верни JSON массив: [{"name":"...","description":"...","reason":"...","rating":}]. Дай 5 достопримечательностей. Для каждого места укажи реалистичный рейтинг. Только JSON.`;
    const aiRaw = await aiChat(fullPrompt);

    let data;
    try {
      const jsonMatch = aiRaw.match(/\[[\s\S]*\]/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return res.status(500).json({
        message: "Invalid JSON received from AI",
        raw: aiRaw
      });
    }

    const formatted = data.map((p, i) => ({
      name: p.name || `Место ${i + 1}`,
      description: p.description || '',
      formatted_address: p.formatted_address || p.address || p.location || '',
      rating: p.rating ? parseFloat(p.rating) : null, // Используем рейтинг из AI или null
      reason: p.reason || "AI Recommendation"
    }));

    res.json({ results: formatted });

  } catch (err) {
    // Детальная обработка ошибок для отладки
    const errorMessage = err.message || 'Unknown error';
    const errorDetails = err.response?.data || err.response?.statusText;
    
    res.status(err.response?.status || 500).json({ 
      message: "AI request failed", 
      error: errorMessage,
      details: errorDetails,
      model: process.env.HUGGINGFACE_MODEL || 'unknown'
    });
  }
});

// ======================
//    IMAGE GENERATION FOR TOURS
// ======================
router.post('/generate-tour-image/:tourId', auth, async (req, res) => {
  try {
    const { tourId } = req.params;
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const tour = await Tour.findById(tourId).populate('destination');
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // Используем Z-Image-Turbo через fal.ai
    if (!process.env.HUGGINGFACE_API_KEY) {
      return res.status(500).json({ message: "Hugging Face API key not configured" });
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const hfImageModel = process.env.HUGGINGFACE_IMAGE_MODEL || "Tongyi-MAI/Z-Image-Turbo";

    try {
      const imageBlob = await hf.textToImage({
        provider: "fal-ai",
        model: hfImageModel,
        inputs: prompt,
        parameters: {
          num_inference_steps: parseInt(process.env.HF_IMAGE_STEPS || "9"),
          guidance_scale: parseFloat(process.env.HF_IMAGE_GUIDANCE || "0.0"),
          height: parseInt(process.env.HF_IMAGE_HEIGHT || "1024"),
          width: parseInt(process.env.HF_IMAGE_WIDTH || "1024")
        }
      });

      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageBase64 = buffer.toString('base64');
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      // Проверяем размер изображения
      const imageSizeMB = (imageUrl.length / (1024 * 1024)).toFixed(2);
      
      // Ограничиваем размер изображения (16MB максимум для MongoDB)
      const maxImageSize = 16 * 1024 * 1024;
      
      if (imageUrl.length > maxImageSize) {
        return res.status(413).json({ 
          message: `Image is too large to save (${imageSizeMB}MB). Maximum size is 16MB.`,
          imageSize: imageUrl.length
        });
      }
      
      // Сохраняем изображение в БД
      try {
        const updatedTour = await Tour.findByIdAndUpdate(
          tourId,
          {
            generatedImage: imageUrl,
            imagePrompt: prompt
          },
          {
            new: true,
            runValidators: true
          }
        ).populate('destination');
        
        if (!updatedTour) {
          return res.status(404).json({ 
            message: "Tour not found after update"
          });
        }
        
        // Проверяем, что изображение сохранилось
        if (!updatedTour.generatedImage) {
          return res.status(500).json({ 
            message: "Failed to save image to database - image field is empty"
          });
        }
        
        res.json({ 
          imageUrl: updatedTour.generatedImage,
          tour: updatedTour,
          message: "Image generated and saved successfully",
          imageSizeMB: imageSizeMB
        });
      } catch (saveError) {
        return res.status(500).json({ 
          message: "Error saving image to database",
          error: saveError.message,
          stack: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
        });
      }
    } catch (hfErr) {
      const errorMessage = hfErr.message || 'Unknown error';
      
      if (errorMessage.includes('Pre-paid credits')) {
        return res.status(402).json({ 
          message: "Pre-paid credits required for fal-ai provider",
          error: errorMessage
        });
      }

      res.status(500).json({ 
        message: "Image generation failed", 
        error: errorMessage
      });
    }
  } catch (err) {
    res.status(500).json({ 
      message: "Server error", 
      error: err.message
    });
  }
});

module.exports = router;
