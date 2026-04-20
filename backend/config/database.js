const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;

    if (!mongoUrl) {
      throw new Error('Set MONGO_URI or MONGO_URL in backend/.env before starting the server');
    }

    if (!dbName) {
      throw new Error('Set DB_NAME in backend/.env before starting the server');
    }
    
    const normalizedMongoUrl = mongoUrl.replace(/\/+$/, '');
    await mongoose.connect(`${normalizedMongoUrl}/${encodeURIComponent(dbName)}`);
    
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;