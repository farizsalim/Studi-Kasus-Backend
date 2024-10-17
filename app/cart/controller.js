const Product = require('../products/model');
const CartItem = require('../cart-item/model');

const update = async (req, res, next) => {
    try {
      // Log request body untuk debugging
      console.log(req.body);
  
      // Destruktur `items` dari `req.body`, berikan default kosong jika tidak ada
      const { items = [] } = req.body;
  
      // Validasi jika `items` tidak ada atau bukan array
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 1,
          message: 'Items should be a non-empty array'
        });
      }
  
      // Ambil semua `product` IDs dari items yang dikirim
      const productIds = items.map(item => item.product);
  
      // Cari produk berdasarkan ID yang ada di `productIds`
      const products = await Product.find({ _id: { $in: productIds } });
  
      // Jika produk tidak ditemukan, beri response error
      if (products.length === 0) {
        return res.status(404).json({
          error: 1,
          message: 'No products found for the provided product IDs'
        });
      }
  
      // Map items yang akan dimasukkan ke cart
      let cartItems = items.map(item => {
        // Cocokkan setiap product dengan item
        let relatedProduct = products.find(product => product._id.toString() === item.product);
  
        // Pastikan produk terkait ditemukan
        if (!relatedProduct) {
          throw new Error(`Product not found: ${item.product}`);
        }
  
        // Return format item cart yang akan disimpan
        return {
          product: relatedProduct._id,
          price: relatedProduct.price,
          image_url: relatedProduct.image_url,
          name: relatedProduct.name,
          user: req.user._id, // Menghubungkan item dengan user
          qty: item.qty
        };
      });
  
      // Hapus semua item cart lama untuk user yang sedang login
      await CartItem.deleteMany({ user: req.user._id });
  
      // Simpan item cart baru dengan upsert
      await CartItem.bulkWrite(cartItems.map(item => {
        return {
          updateOne: {
            filter: {
              user: req.user._id,
              product: item.product
            },
            update: item,
            upsert: true
          }
        };
      }));
  
      // Response dengan cartItems yang sudah disimpan
      return res.json(cartItems);
    } catch (err) {
      // Handle error validasi dan error lainnya
      if (err && err.name === 'ValidationError') {
        return res.status(400).json({
          error: 1,
          message: err.message,
          fields: err.errors
        });
      }
  
      // Kirimkan error lain ke middleware berikutnya
      next(err);
    }
  };

const index = async (req, res, next) => {
  try {
    let items = await CartItem
      .find({ user: req.user._id })
      .populate('product');

    return res.json(items);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: err.message,
        fields: err.errors
      });
    }
    next(err);
  }
};

module.exports = {
  update,
  index
};
