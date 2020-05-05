const mongoose = require("mongoose");

const Contract = mongoose.model(
  "Contract",
  new mongoose.Schema({
    _id: String,
    name: String,
    description: String
  })
);

module.exports = Contract;