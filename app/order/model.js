const mongoose = require('mongoose');
const { model, Schema } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Invoice = require('../invoice/model');

const orderSchema = new Schema({
    status: {
        type: String,
        enum: ['waiting_payment', 'processing', 'in_delivery', 'delivered'],
        default: 'waiting_payment',
    },
    delivery_fee: {
        type: Number,
        default: 0,
    },
    delivery_address: {
        provinsi: { type: String, required: [true, 'provinsi harus diisi.'] },
        kabupaten: { type: String, required: [true, 'kabupaten harus diisi.'] },
        kecamatan: { type: String, required: [true, 'kecamatan harus diisi.'] },
        kelurahan: { type: String, required: [true, 'kelurahan harus diisi.'] },
        detail: { type: String },
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order_items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
}, {
    timestamps: true,
});

// After saving the order, create the corresponding invoice
orderSchema.post('save', async function () {
    // Menghitung subtotal berdasarkan order_items
    let sub_total = await this.populate('order_items').then(order => {
        return order.order_items.reduce((total, item) => total + (item.price * item.qty), 0);
    });

    // Buat invoice setelah order disimpan
    let invoice = new Invoice({
        user: this.user,
        order: this._id,
        sub_total: sub_total,
        delivery_fee: parseInt(this.delivery_fee),
        total: parseInt(sub_total + this.delivery_fee),
        delivery_address: this.delivery_address,
    });

    // Simpan invoice ke database
    await invoice.save();
});

module.exports = model('Order', orderSchema);
