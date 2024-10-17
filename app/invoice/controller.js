const { subject } = require('@casl/ability');
const Invoice = require('../invoice/model'); // Mengganti invoice dengan Invoice untuk lebih jelas
const { policyFor } = require('../../utils');

const show = async (req, res, next) => {
    try {
        let policy = policyFor(req.user);
        
        // Mendapatkan order_id dari params
        const { order_id } = req.params;

        // Mencari invoice berdasarkan order_id
        const invoiceData = await Invoice
            .findOne({ order: order_id })
            .populate('order')
            .populate('user');

        // Jika invoice tidak ditemukan
        if (!invoiceData) {
            return res.status(404).json({
                error: 1,
                message: 'Invoice tidak ditemukan.'
            });
        }

        // Membuat subjek untuk kebijakan akses
        const subjectInvoice = subject('Invoice', { ...invoiceData, user_id: invoiceData.user._id });

        // Memeriksa apakah pengguna memiliki akses untuk melihat invoice
        if (!policy.can('read', subjectInvoice)) {
            return res.status(403).json({
                error: 1,
                message: 'Anda tidak memiliki akses untuk melihat invoice ini.'
            });
        }

        // Jika izin diberikan, mengembalikan invoice
        return res.json(invoiceData);
    } catch (err) {
        console.error(err); // Menyimpan log kesalahan untuk debug
        return res.status(500).json({
            error: 1,
            message: 'Terjadi kesalahan saat mengambil invoice.'
        });
    }
}

module.exports = {
    show
}
