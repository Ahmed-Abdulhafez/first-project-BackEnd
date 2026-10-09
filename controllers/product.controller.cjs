const productModel = require("../models/product.schema.cjs");
const cloudinary = require("cloudinary").v2;

// get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page, limit } = req.query;
    let queryArgs = {};
    if (search) {
      queryArgs.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      queryArgs.category = category;
    }

    if (minPrice || maxPrice) {
      queryArgs.price = {};
      if (minPrice) queryArgs.price.$gte = Number(minPrice);
      if (maxPrice) queryArgs.price.$lte = Number(maxPrice);
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const totalProducts = await productModel.countDocuments(queryArgs);
    const totalPages = Math.ceil(totalProducts / limitNumber);

    const products = await productModel
      .find(queryArgs)
      .populate("category", "name")
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({
      message: "Products fetched successfully",
      pagination: {
        totalProducts,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      results: products.length,
      data: products,
    });
  } catch (error) {
    console.log("Error fetching products:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// get product By id
exports.getProductById = async (req, res) => {
  try {
    const product = await productModel
      .findById(req.params.id)
      .populate("category", "name");
    if (!product) {
      return res.status(404).json({ message: "Product Not Found!" });
    }
    return res.status(200).json({
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    console.log("Error getting Product by ID:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Product ID format" });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// create new product
exports.createNewProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Please upload at least one image!" });
    }

    const uploadedImages = req.files.map((file) => {
      return {
        url: file.path,
        public_id: file.filename,
      };
    });

    const {
      title,
      desc,
      price,
      offerPrice,
      category,
      brand,
      stock,
      isFeatured,
      rating,
      numReviews,
    } = req.body;

    const productData = {
      title,
      desc,
      price,
      offerPrice,
      category,
      brand,
      stock: stock || 0,
      isFeatured: isFeatured || false,
      rating: rating || 0,
      numReviews: numReviews || 0,
      images: uploadedImages,
    };

    const newProduct = new productModel(productData);
    const saveProduct = await newProduct.save();
    await saveProduct.populate("category", "name");
    return res.status(201).json({
      message: "Product created successfully with images",
      data: saveProduct,
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      console.log(
        "Images removed from Cloudinary due to database save failure.",
      );
    }
    console.log("Error creating book:", error);

    return res.status(500).json({
      message: "Failed to save book",
      error: error.message,
    });
  }
};

// updated product
exports.updateProduct = async (req, res) => {
  // مصفوفة الصور الجديدة لسهولة الوصول إليها في الـ catch
  const files = Array.isArray(req.files) ? req.files : [];

  try {
    const { id } = req.params;

    const {
      title,
      desc,
      price,
      offerPrice,
      stock,
      brand,
      category,
      isFeatured,
    } = req.body;

    const updateData = {
      title,
      desc,
      price,
      offerPrice,
      stock,
      brand,
      category,
      isFeatured,
    };

    // تنظيف الحقول غير المرسلة
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const product = await productModel.findById(id);
    if (!product) {
      // إذا لم يتم العثور على المنتج، نحذف الصور الجديدة التي حُمّلت للتو
      if (files.length > 0) {
        const cleanupPromises = files.map((file) =>
          cloudinary.uploader.destroy(file.filename),
        );
        await Promise.allSettled(cleanupPromises);
      }

      return res.status(404).json({
        message: "Product not found!",
      });
    }

    // الاحتفاظ بالصور القديمة لاستخدامها بعد نجاح الحفظ
    const oldImages = product.images || [];

    // تحديث البيانات في الـ Document
    Object.assign(product, updateData);

    // إذا وصلت صور جديدة، نحدث مصفوفة الصور
    if (files.length > 0) {
      product.images = files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    // تشغيل الـ Validators وتحديث القاعدة
    const updatedProduct = await product.save();

    // حذف الصور القديمة بالتوازي (In Parallel) لسرعة الأداء
    if (files.length > 0 && oldImages.length > 0) {
      const deletePromises = oldImages
        .filter((img) => img.public_id)
        .map((img) => cloudinary.uploader.destroy(img.public_id));

      // نستخدم Promise.allSettled لضمان استمرار الكود حتى لو فشلت صورة
      Promise.allSettled(deletePromises).catch((err) =>
        console.error("Error deleting old images from Cloudinary:", err),
      );
    }

    return res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // تراجع (Rollback): إذا فشل الحفظ في قاعدة البيانات، نحذف الصور الجديدة المرفوعة
    if (files.length > 0) {
      const rollbackPromises = files.map((file) =>
        cloudinary.uploader.destroy(file.filename),
      );
      await Promise.allSettled(rollbackPromises);
    }

    console.error("Error updating Product:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product data",
        errors: error.errors
          ? Object.values(error.errors).map((e) => e.message)
          : [error.message],
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// deleted product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    if (product.images && product.images.length > 0) {
      for (let image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
    await productModel.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Product and all its images deleted successfully" });
  } catch (error) {
    console.log("Error deleting Product:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Toggle like/unlike product
exports.toggleLikeProduct = async (req, res) => {
  try {
    const productId = req.params.id; // معرف المنتج من الرابط (URL)
    const userId = req.user.id; // معرف المستخدم من الـ Token

    // 1. البحث عن المنتج في قاعدة البيانات
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    // 2. التحقق مما إذا كان المستخدم موجوداً في مصفوفة الإعجابات
    const isLiked = product.likes.includes(userId);

    if (isLiked) {
      // 3 أ: إذا كان معجباً به، نقوم بإلغاء الإعجاب (حذفه من المصفوفة)
      // نستخدم $pull الخاص بـ MongoDB لإزالة الـ userId من مصفوفة likes
      await Product.findByIdAndUpdate(
        productId,
        { $pull: { likes: userId } },
        { new: true }, // لإرجاع النسخة المحدثة من المنتج
      );

      return res.status(200).json({
        message: "تم إلغاء الإعجاب بنجاح",
        isLiked: false,
      });
    } else {
      // 3 ب: إذا لم يكن معجباً به، نقوم بالإضافة (إعجاب)
      // نستخدم $addToSet بدلاً من $push لضمان عدم إضافة نفس الـ userId أكثر من مرة
      await Product.findByIdAndUpdate(
        productId,
        { $addToSet: { likes: userId } },
        { new: true },
      );

      return res.status(200).json({
        message: "تم الإعجاب بالمنتج بنجاح",
        isLiked: true,
      });
    }
  } catch (error) {
    console.error("خطأ في عملية الإعجاب:", error);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};
