const mongoose = require("mongoose");
const Joi = require("joi");

const schema = new mongoose.Schema({
  name: String,
  info: String,
  category: String,
  img_url: String,
  price: Number,
  user_id: String
},{timestamps:true})

exports.ToyModel = mongoose.model("toys",schema);

exports.validToy = (_reqBody) => {
  const joiSchema = Joi.object({
    name:Joi.string().min(2).max(100).required(),
    info:Joi.string().min(2).max(400).required(),
    category:Joi.string().min(2).max(100).required(),
    price:Joi.number().min(1).max(9999).required(),
    img_url:Joi.string().min(2).max(400).allow(null,"")
  }).required()
  return joiSchema.validate(_reqBody)
}
