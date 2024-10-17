const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../deliveryAddress/model');
const Order = require('../order/model');
const OrderItem = require('../order-item/model');
const { Types } = require("mongoose");

const store = async (req, res, next) => {
    try {
        console.log('Request Body:', req.body);

        let { delivery_fee, delivery_address } = req.body;

        // Ambil items dari CartItem user
        let items = await CartItem.find({ user: req.user._id }).populate('product');
        if (!items || items.length === 0) {
            console.log('No items found in cart');
            return res.json({
                error: 1,
                message: `You're not able to create an order because you have no items in cart`,
            });
        }
        console.log('Cart items found:', items);
        
        // Ambil data alamat dari database berdasarkan ID yang diberikan
        let address = await DeliveryAddress.findById(delivery_address);
        if (!address) {
            console.log('Delivery address not found');
            return res.status(400).json({
                error: 1,
                message: 'Delivery address not found',
            });
        }
        console.log('Delivery address found:', address);
        
        // Buat order baru
        console.log('Creating new order for user:', req.user._id);
        let order = new Order({
            _id: new Types.ObjectId(),
            status: 'waiting_payment',
            delivery_fee: delivery_fee,
            delivery_address: {
                provinsi: address.provinsi,
                kabupaten: address.kabupaten,
                kecamatan: address.kecamatan,
                kelurahan: address.kelurahan,
                detail: address.detail,
            },
            user: req.user._id,
        });
        
        // Simpan items dari cart ke dalam order items
        console.log('Saving order items...');
        let orderItems = await OrderItem.insertMany(
            items.map((item) => ({
                name: item.product.name,
                qty: parseInt(item.qty),
                price: parseInt(item.product.price),
                order: order._id,
                product: item.product._id,
            }))
        );
        
        
        // Masukkan items ke dalam order dan simpan order
        order.order_items.push(...orderItems);
        
        // Cek sebelum menyimpan order
        console.log('Order data before saving:', order);
        await order.save()

        console.log('Order items saved:', orderItems);

        // Hapus items dari cart setelah order dibuat
        await CartItem.deleteMany({ user: req.user._id });

        return res.json(order);
    } catch (err) {
        console.error('Error occurred:', err);
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        return next(err);
    }
};



const index = async (req, res, next) => {
    try {
        let { skip = 0, limit = 10 } = req.query;

        // Count total orders for the user
        let count = await Order.find({ user: req.user._id }).countDocuments();

        // Find paginated orders for the user
        let orders = await Order.find({ user: req.user._id })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('order_items')
            .sort('createdAt');

        // Send back the orders and count
        return res.status(200).json({
            data: orders.map(order => order.toJSON({ virtuals: true })),
            count,
        });
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors,
            });
        }
        next(err);
    }
};

module.exports = {
    store,
    index,
};
