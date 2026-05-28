const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);

    // Dev fallback — in-memory MongoDB
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('🔄 Trying in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mms = await MongoMemoryServer.create();
        await mongoose.connect(mms.getUri());
        console.log('✅ In-memory MongoDB started (data resets on restart)');
      } catch (e2) {
        console.error('❌ Fallback also failed:', e2.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
