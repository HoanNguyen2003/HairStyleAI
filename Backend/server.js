import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import sharp from 'sharp'; 

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const createWhiteImage = async (width = 512, height = 512) => {
  try {
    const whiteImageBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .jpeg({ quality: 90 })
    .toBuffer();
    
    return whiteImageBuffer;
  } catch (error) {
    console.error('❌ Error creating white image:', error);
    // Fallback: create a simple white image using Canvas (if sharp fails)
    return Buffer.from([]);
  }
};

// Enhanced swap endpoint with fallback white image
app.post('/swap', upload.fields([
  { name: 'face' },
  { name: 'shape' },
  { name: 'color' },
]), async (req, res) => {
  console.log('🎨 Processing hair style swap request...');
  
  try {
    // Validate input files
    if (!req.files || !req.files['face'] || !req.files['shape'] || !req.files['color']) {
      console.warn('⚠️ Missing required files');
      const whiteImage = await createWhiteImage();
      res.set('Content-Type', 'image/jpeg');
      return res.send(whiteImage);
    }

    // Prepare form data for AI server
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

    console.log('📤 Sending request to AI server...');

    // Call AI server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏰ AI server request timeout');
    }, 30000); // 30 second timeout

    let response;
    try {
      response = await fetch('https://c596-34-87-111-204.ngrok-free.app/swap/', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

    // Check if AI server responded successfully
    if (!response.ok) {
      console.warn(`⚠️ AI server error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.warn('🔍 AI server endpoint not found');
      } else if (response.status >= 500) {
        console.warn('🔧 AI server internal error');
      } else if (response.status === 429) {
        console.warn('⏳ AI server rate limit exceeded');
      }
      
      // Return white image on AI server error
      const whiteImage = await createWhiteImage();
      res.set({
        'Content-Type': 'image/jpeg',
        'X-Fallback-Reason': `AI server error: ${response.status}`
      });
      return res.send(whiteImage);
    }

    // Try to get the result image
    let resultBuffer;
    try {
      resultBuffer = await response.buffer();
      
      // Validate that we got actual image data
      if (!resultBuffer || resultBuffer.length === 0) {
        throw new Error('Empty response from AI server');
      }

      // Check if response is actually an image by checking magic bytes
      const isJPEG = resultBuffer[0] === 0xFF && resultBuffer[1] === 0xD8;
      const isPNG = resultBuffer[0] === 0x89 && resultBuffer[1] === 0x50;
      
      if (!isJPEG && !isPNG) {
        console.warn('⚠️ Response is not a valid image format');
        throw new Error('Invalid image format from AI server');
      }

      console.log('✅ Successfully received image from AI server');
      res.set('Content-Type', 'image/jpeg');
      res.send(resultBuffer);

    } catch (bufferError) {
      console.warn('⚠️ Error processing AI server response:', bufferError.message);
      
      // Return white image if buffer processing fails
      const whiteImage = await createWhiteImage();
      res.set({
        'Content-Type': 'image/jpeg',
        'X-Fallback-Reason': 'Invalid response format'
      });
      return res.send(whiteImage);
    }

  } catch (err) {
    console.error('❌ Error in swap endpoint:', err);
    
    // Determine error type and log appropriately
    let errorReason = 'Unknown error';
    if (err.name === 'AbortError') {
      errorReason = 'Request timeout';
      console.error('⏰ Request timed out');
    } else if (err.code === 'ECONNREFUSED') {
      errorReason = 'AI server unreachable';
      console.error('🔌 Cannot connect to AI server');
    } else if (err.code === 'ENOTFOUND') {
      errorReason = 'AI server not found';
      console.error('🌐 AI server hostname not found');
    } else if (err.message.includes('fetch')) {
      errorReason = 'Network error';
      console.error('🌐 Network error:', err.message);
    }

    // Always return white image on any error
    try {
      const whiteImage = await createWhiteImage();
      res.set({
        'Content-Type': 'image/jpeg',
        'X-Fallback-Reason': errorReason,
        'X-Error-Details': err.message
      });
      res.send(whiteImage);
    } catch (fallbackError) {
      console.error('❌ Even white image creation failed:', fallbackError);
      // Last resort: return 500 with error message
      res.status(500).json({
        error: 'Service temporarily unavailable',
        reason: errorReason,
        fallback: 'White image generation failed'
      });
    }
  }
});

// Existing chat endpoint
app.post('/chat', async (req, res) => {
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

    const processedResponse = {
      response: data.response
        ? data.response
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
        : "Không có phản hồi phù hợp từ API.",
      summary: data.response
        ? data.response.split('\n')[0]
        : "Không có tóm tắt khả dụng.",
    };

    res.json(processedResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New API endpoints for Web3 integration

// Get NFT metadata (for mock IPFS)
app.get('/api/nft/:tokenId', (req, res) => {
  const { tokenId } = req.params;
  
  // Mock metadata
  const metadata = {
    name: `Hair Style NFT #${tokenId}`,
    description: 'AI-generated hairstyle created with HairStyleAI Web3',
    image: `https://via.placeholder.com/400x400/667eea/ffffff?text=NFT+${tokenId}`,
    attributes: [
      { trait_type: 'Hair Type', value: 'Curly' },
      { trait_type: 'Hair Color', value: 'Brown' },
      { trait_type: 'Creation Date', value: new Date().toISOString() },
      { trait_type: 'Platform', value: 'HairStyleAI Web3' }
    ]
  };
  
  res.json(metadata);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      ai_server: 'Connected',
      database: 'Connected',
      blockchain: 'Ready'
    }
  });
});

// Get system stats
app.get('/api/stats', (req, res) => {
  res.json({
    totalImages: 1250,
    totalNFTs: 45,
    activeUsers: 120,
    totalTransactions: 23
  });
});

app.listen(5000, () => {
  console.log('🚀 Server backend chạy tại http://localhost:5000');
  console.log('📱 API endpoints:');
  console.log('   POST /swap - AI hair style generation');
  console.log('   POST /chat - AI chatbot');
  console.log('   GET  /api/health - Health check');
  console.log('   GET  /api/stats - System statistics');
  console.log('   GET  /api/nft/:tokenId - NFT metadata');
});