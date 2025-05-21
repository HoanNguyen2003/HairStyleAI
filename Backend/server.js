import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
const upload = multer();

app.use(cors()); // Cho phép gọi từ mọi origin, có thể chỉnh thành 'http://localhost:3000' nếu muốn

app.post('/swap', upload.fields([
  { name: 'face' },
  { name: 'shape' },
  { name: 'color' },
]), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('face', req.files['face'][0].buffer, {
      filename: req.files['face'][0].originalname,
      contentType: req.files['face'][0].mimetype,
    });
    formData.append('shape', req.files['shape'][0].buffer, {
      filename: req.files['shape'][0].originalname,
      contentType: req.files['shape'][0].mimetype,
    });
    formData.append('color', req.files['color'][0].buffer, {
      filename: req.files['color'][0].originalname,
      contentType: req.files['color'][0].mimetype,
    });

    const response = await fetch('https://5984-34-124-205-113.ngrok-free.app/swap/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return res.status(response.status).send('Lỗi từ AI server');
    }

    const resultBuffer = await response.buffer();
    res.set('Content-Type', 'image/jpeg'); // hoặc png tùy output từ AI
    res.send(resultBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

app.post('/chat', express.json(), async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const url = "https://56b4-34-23-50-177.ngrok-free.app/geminiChat";

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error from GPT API' });
    }

    const data = await response.json();

    // Xử lý dữ liệu trước khi trả về frontend
    const processedResponse = {
      response: data.response
        ? data.response
            .replace(/\n/g, '<br>') // Thay thế ký tự xuống dòng bằng thẻ HTML `<br>`
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Thay thế **text** bằng thẻ <strong>
            .replace(/_(.*?)_/g, '<em>$1</em>') // Thay thế _text_ bằng thẻ <em>
        : "Không có phản hồi phù hợp từ API.",
      summary: data.response
        ? data.response.split('\n')[0] // Lấy dòng đầu tiên làm tóm tắt
        : "Không có tóm tắt khả dụng.",
    };

    res.json(processedResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, () => {
  console.log('Server backend chạy tại http://localhost:5000');
});
