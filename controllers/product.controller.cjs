const productModel = require("../models/Product.schema.cjs");
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
exports.updatedProduct = async (req, res) => {
  try {
    let { title, desc, price, stock, brand, category, isFeatured } = req.body;
    let updateData = { title, desc, price, stock, brand, category, isFeatured };

    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => value !== undefined),
    );
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    if (product.images && product.images.length > 0) {
      console.log("Starting to delete old images...");

      for (let image of product.images) {
        const result = await cloudinary.uploader.destroy(image.public_id);

        console.log(`Deletion result for image ${image.public_id}:`, result);
      }
    }

    updateData.images = req.files.map((file) => {
      return {
        url: file.path,
        public_id: file.filename,
      };
    });

    const updatedProduct = await productModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found!" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log("Error updating Product:", error);
    return res.status(500).json({ message: "Server Error" });
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
