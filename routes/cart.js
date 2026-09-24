// routes/cart.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/CartSchema");
const Product = require("../models/Product.schema.cjs");
const { cookieAuth } = require("../auth/middelware");

// جلب سلة المشتريات للمستخدم الحالي
router.get("/", cookieAuth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
      "title stock price images"
    );

    // ✅ إنشاء سلة جديدة لو مش موجودة
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      msg: "Cart fetched successfully",
      cart,
    });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

// إضافة منتج إلى سلة المشتريات
router.post("/add", cookieAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
      "title stock price images"
    );

    if (!cart) {
      return res.status(404).json({ success: false, msg: "Cart not found" });
    }

    // ✅ الإصلاح هنا
    const itemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price: product.price,
      });
    }

    // تقليل المخزون
    product.stock -= 1;
    await product.save();
    await cart.save();

    // ✅ رجّع السلة بعد التعديل
    await cart.populate("items.product", "title stock price images");
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("❌ Error adding product to cart:", error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});


// تحديث كمية منتج في سلة المشتريات
router.put("/update", cookieAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
      "title stock price images"
    );
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    const item = cart.items.find(
      (it) => it.product._id.toString() === productId
    );

    const product = await Product.findById(productId);

    const diff = quantity - item.quantity;
    if (diff > 0) {
      if (product.stock < diff) {
        return res
          .status(400)
          .json({ success: false, msg: "Insufficient stock" });
        product.stock -= diff;
      } else {
        product.stock += Math.abs(diff);
      }
    }
    item.quantity = quantity;
    await product.save();
    await cart.save();
    res.json({ success: true, msg: "Cart updated successfully", cart });
  } catch (error) {
    console.error("❌ Error updating cart:", error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

// ✅ زيادة كمية منتج في السلة
router.put("/increase", cookieAuth, async (req, res) => {
  try {
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
      "title stock price images"
    );

    if (!cart)
      return res.status(404).json({ success: false, msg: "Cart not found" });

    const item = cart.items.find(
      (it) => it.product._id.toString() === productId
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, msg: "Product not in cart" });

    const product = await Product.findById(productId);
    if (!product || product.stock <= 0)
      return res.status(400).json({ success: false, msg: "Out of stock" });

    item.quantity += 1;
    product.stock -= 1;

    await product.save();
    await cart.save();

    res.json({ success: true, msg: "Quantity increased", cart });
  } catch (error) {
    console.error("❌ Error increasing quantity:", error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

// ✅ تقليل كمية منتج في السلة
router.put("/decrease", cookieAuth, async (req, res) => {
  try {
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
      "title stock price images"
    );

    if (!cart)
      return res.status(404).json({ success: false, msg: "Cart not found" });

    const item = cart.items.find(
      (it) => it.product._id.toString() === productId
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, msg: "Product not in cart" });

    if (item.quantity > 1) {
      item.quantity -= 1;
      const product = await Product.findById(productId);
      if (product) {
        product.stock += 1;
        await product.save();
      }
      await cart.save();
      return res.json({ success: true, msg: "Quantity decreased", cart });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "Quantity cannot be less than 1" });
    }
  } catch (error) {
    console.error("❌ Error decreasing quantity:", error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

// إزالة منتج من سلة المشتريات
// routes/cart.js
router.delete("/remove", cookieAuth, async (req, res) => {
  const session = await Cart.db.startSession(); // or mongoose.startSession()
  session.startTransaction();
  try {
    const { productId } = req.body;

    // جلب وثيقة السلة داخل الـ session
    const cart = await Cart.findOne({ userId: req.user.id }).session(session);

    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, msg: "Cart not found" });
    }

    const item = cart.items.find(
      (it) => it.product.toString() === productId.toString()
    );

    if (!item) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, msg: "Product not in cart" });
    }

    const qtyToReturn = item.quantity || 0;

    // 1) زيادة مخزون المنتج (ضمن الـ session)
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: qtyToReturn } },
      { session }
    );

    // 2) إزالة العنصر من السلة (ضمن الـ session)
    await Cart.updateOne(
      { userId: req.user.id },
      { $pull: { items: { product: productId } } },
      { session }
    );

    // 3) استرجاع السلة المحدثة (ضمن الـ session)
    const updatedCart = await Cart.findOne({ userId: req.user.id })
      .populate("items.product", "title price images stock")
      .session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error removing product from cart (transaction):", error);
    res.status(500).json({ success: false, msg: "Server Error" });
  }
});

module.exports = router;
