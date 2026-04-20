const axios = require('axios');

const STORAGE_URL = 'https://integrations.emergentagent.com/objstore/api/v1/storage';
const APP_NAME = 'food-delivery';
let storageKey = null;

const initStorage = async () => {
  if (storageKey) return storageKey;

  if (!process.env.EMERGENT_LLM_KEY) {
    // No key configured — skip external storage (local dev)
    return null;
  }
  
  try {
    const response = await axios.post(`${STORAGE_URL}/init`, {
      emergent_key: process.env.EMERGENT_LLM_KEY
    }, { timeout: 30000 });
    
    storageKey = response.data.storage_key;
    console.log('Object Storage initialized successfully');
    return storageKey;
  } catch (error) {
    console.error('Storage initialization failed:', error.message);
    throw error;
  }
};

const uploadFile = async (path, buffer, contentType) => {
  const key = await initStorage();
  
  try {
    const response = await axios.put(
      `${STORAGE_URL}/objects/${path}`,
      buffer,
      {
        headers: {
          'X-Storage-Key': key,
          'Content-Type': contentType
        },
        timeout: 120000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('File upload failed:', error.message);
    throw error;
  }
};

const getFile = async (path) => {
  const key = await initStorage();
  
  try {
    const response = await axios.get(
      `${STORAGE_URL}/objects/${path}`,
      {
        headers: {
          'X-Storage-Key': key
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );
    
    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'application/octet-stream'
    };
  } catch (error) {
    console.error('File download failed:', error.message);
    throw error;
  }
};

module.exports = { initStorage, uploadFile, getFile, APP_NAME };