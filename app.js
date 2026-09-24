const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./utils/db");
const cookieParser = require("cookie-parser");

const productRouter = require("./routes/product.router.cjs");
const userRouter = require("./routes/user.router.cjs");
const categoryRouter = require("./routes/category.router");
const cartsRouter = require("./routes/cart.router.cjs");




app.use(cors());
app.use(cookieParser());
app.use(express.json());
// connectDB();

// ✅ المسارات
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/carts", cartsRouter);



const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server is running on port ${PORT}`);
//   });
// });
module.exports = app;
