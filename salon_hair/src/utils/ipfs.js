// Real IPFS implementation using Pinata
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

console.log('🔑 Pinata credentials loaded:', {
  hasApiKey: !!PINATA_API_KEY,
  hasSecretKey: !!PINATA_SECRET_KEY,
  hasJWT: !!PINATA_JWT
});

// Upload file to IPFS via Pinata (REAL implementation)
export const uploadToIPFS = async (file) => {
  try {
    console.log('📤 [REAL PINATA] Uploading file to IPFS:', file.name, 'Size:', file.size);
    
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('❌ Pinata credentials not found in .env file');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add metadata for better file management
    const metadata = JSON.stringify({
      name: `hairstyle-${Date.now()}-${file.name}`,
      keyvalues: {
        platform: 'HairStyleAI',
        type: 'image',
        timestamp: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type
      }
    });
    formData.append('pinataMetadata', metadata);

    // Pinata options
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [REAL PINATA] File uploaded successfully:', {
      ipfsHash: data.IpfsHash,
      pinSize: data.PinSize,
      timestamp: data.Timestamp
    });
    
    return data.IpfsHash;
    
  } catch (error) {
    console.error('❌ [REAL PINATA] Error uploading file:', error);
    throw error; // Don't fallback to mock, throw error instead
  }
};

// Upload JSON to IPFS via Pinata (REAL implementation)
export const uploadJSONToIPFS = async (jsonData) => {
  try {
    console.log('📤 [REAL PINATA] Uploading JSON to IPFS:', jsonData);
    
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('❌ Pinata credentials not found in .env file');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: `hairstyle-metadata-${Date.now()}.json`,
          keyvalues: {
            platform: 'HairStyleAI',
            type: 'metadata',
            timestamp: new Date().toISOString(),
            nftName: jsonData.name,
            creator: jsonData.attributes?.find(attr => attr.trait_type === 'Creator')?.value
          }
        },
        pinataOptions: {
          cidVersion: 0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata JSON upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [REAL PINATA] JSON uploaded successfully:', {
      ipfsHash: data.IpfsHash,
      pinSize: data.PinSize,
      timestamp: data.Timestamp
    });
    
    return data.IpfsHash;
    
  } catch (error) {
    console.error('❌ [REAL PINATA] Error uploading JSON:', error);
    throw error;
  }
};

// Get content from IPFS (using Pinata gateway)
export const getFromIPFS = (hash) => {
  if (!hash) return null;
  
  // Use Pinata gateway for all IPFS content
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
};

// Test Pinata connection
export const testPinataConnection = async () => {
  try {
    console.log('🧪 Testing Pinata connection...');
    
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata credentials not configured');
    }

    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Pinata connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Pinata connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Get user's pinned files from Pinata
export const getPinnedFiles = async () => {
  try {
    const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100', {
      method: 'GET',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get pinned files: ${response.status}`);
    }

    const data = await response.json();
    return data.rows;
  } catch (error) {
    console.error('Error getting pinned files:', error);
    throw error;
  }
};

// Alternative implementation using JWT (preferred method)
export const uploadToIPFSWithJWT = async (file) => {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata JWT upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading with JWT:', error);
    throw error;
  }
};