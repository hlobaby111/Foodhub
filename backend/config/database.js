const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;
    
    await mongoose.connect(`${mongoUrl}/${dbName}`);
    
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;