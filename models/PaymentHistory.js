const mongoose = require('mongoose');

var PaymentHistory = mongoose.model(
    "PaymentHistory", 
    new mongoose.Schema({
        _id: {
            type: String
        },
        description: {
            type: String,
        },
        value: {
            type: Number,
        },
        time: {
            type: String,
        },
        isImported: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: String,
            default: Date.now
        },
        updatedAt: {
            type: String,
            default: Date.now
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        contractId: {
            type: String,
            ref: "Contract"
        }
    }).index({"$**":"text"})
);

module.exports = PaymentHistory;