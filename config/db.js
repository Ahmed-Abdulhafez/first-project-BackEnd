const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🚀 Trying to connect to MongoDB...");
    console.log(
      "🔗 MONGO_URI:",
      process.env.MONGO_DB_URL ? "✅ Loaded" : "❌ Missing"
    );

    // تم حذف الخيارات القديمة لأن Mongoose الحديث لا يحتاجها
    const conn = await mongoose.connect(process.env.MONGO_DB_URL);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;