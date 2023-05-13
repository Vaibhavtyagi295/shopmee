const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const menuSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    categories: { type: String, enum: ['tech', 'clothes', 'shoes', 'electronics', 'household'], required: true },
    deliveryTime: { type: Number, default: 4, min: 1, max: 30 },
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);
