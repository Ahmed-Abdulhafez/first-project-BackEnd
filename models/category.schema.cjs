const mongoose = require('mongoose')
const schema = mongoose.Schema
const categorySchema = new schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  }
}, { timestamps: true })

module.exports = mongoose.model("Category", categorySchema);
