const mongoose = require("mongoose");
const schema = mongoose.Schema;

const cartItemSchema = new schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Quantity can not be less than 1."],
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

// 2. خريطة السلة بالكامل (Cart Schema)
const cartSchema = new schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    cartItems: [cartItemSchema],
    totalCartPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
