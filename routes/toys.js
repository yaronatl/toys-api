const express = require("express");
const mongoose = require("mongoose");
const { ToyModel, validToy } = require("../models/toyModel");
const { auth } = require("../middlewares/auth");
const router = express.Router();

const LIMIT = 10;

// ?skip is the page number, not the number of documents to skip
const getPage = (req) => {
  const page = Math.floor(Number(req.query.skip));
  return page > 0 ? page : 0;
}

// escape regex special chars so user input is matched as plain text
const safeRegExp = (text, exact = false) => {
  const escaped = String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(exact ? "^" + escaped + "$" : escaped, "i")
}

const searchFilter = (s) => {
  const searchExp = safeRegExp(s)
  return { $or: [{ name: searchExp }, { info: searchExp }] }
}

const SORT_FIELDS = ["_id", "name", "category", "price", "createdAt"]
const getSort = (req) => {
  const sort = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : "_id"
  const direction = req.query.reverse == "yes" ? -1 : 1
  return { [sort]: direction }
}

const isEmpty = (v) => v === undefined || v === null || v === ""

router.get("/", async (req, res) => {
  const conditions = []
  if (!isEmpty(req.query.s)) {
    conditions.push(searchFilter(req.query.s))
  }
  const cat = req.query.category || req.query.cat
  if (!isEmpty(cat)) {
    conditions.push({ category: safeRegExp(cat, true) })
  }
  const findFilter = conditions.length ? { $and: conditions } : {}

  try {
    const data = await ToyModel
      .find(findFilter)
      .limit(LIMIT)
      .skip(getPage(req) * LIMIT)
      .sort(getSort(req))
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/count", async (req, res) => {
  try {
    const data = await ToyModel.countDocuments({})
    res.json({ count: data, pages: Math.ceil(data / LIMIT) })
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/search", async (req, res) => {
  if (isEmpty(req.query.s)) {
    return res.status(400).json({ err: "You need to send the search query ?s=" })
  }
  try {
    const data = await ToyModel
      .find(searchFilter(req.query.s))
      .limit(LIMIT)
      .skip(getPage(req) * LIMIT)
      .sort(getSort(req))
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/prices", async (req, res) => {
  const min = isEmpty(req.query.min) ? null : Number(req.query.min)
  const max = isEmpty(req.query.max) ? null : Number(req.query.max)
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return res.status(400).json({ err: "min and max must be numbers" })
  }
  if (min !== null && max !== null && min > max) {
    return res.status(400).json({ err: "min can't be bigger than max" })
  }
  const priceFilter = {}
  if (min !== null) priceFilter.$gte = min
  if (max !== null) priceFilter.$lte = max
  const findFilter = Object.keys(priceFilter).length ? { price: priceFilter } : {}

  try {
    const data = await ToyModel
      .find(findFilter)
      .limit(LIMIT)
      .skip(getPage(req) * LIMIT)
      .sort(getSort(req))
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/category/:catname", async (req, res) => {
  try {
    const data = await ToyModel
      .find({ category: safeRegExp(req.params.catname, true) })
      .limit(LIMIT)
      .skip(getPage(req) * LIMIT)
      .sort(getSort(req))
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/single/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ err: "Invalid id" })
  }
  try {
    const id = req.params.id
    const data = await ToyModel.findOne({ _id: id });
    if (!data) {
      return res.status(404).json({ err: "Toy not found" })
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.post("/", auth, async (req, res) => {
  const validBody = validToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    const toy = new ToyModel(req.body);
    toy.user_id = req.tokenData._id
    await toy.save();
    res.status(201).json(toy)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.put("/:id", auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ err: "Invalid id" })
  }
  const validBody = validToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    const id = req.params.id;
    // only the owner can edit
    const data = await ToyModel.updateOne({ _id: id, user_id: req.tokenData._id }, validBody.value)
    if (data.matchedCount == 0) {
      return await notOwnerOrNotFound(id, res)
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.delete("/:id", auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ err: "Invalid id" })
  }
  try {
    const id = req.params.id;
    // admin can delete any toy, a regular user only their own
    let data
    if (req.tokenData.role == "admin") {
      data = await ToyModel.deleteOne({ _id: id });
    }
    else {
      data = await ToyModel.deleteOne({ _id: id, user_id: req.tokenData._id });
    }
    if (data.deletedCount == 0) {
      return await notOwnerOrNotFound(id, res)
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

async function notOwnerOrNotFound(id, res) {
  const exists = await ToyModel.exists({ _id: id })
  if (!exists) {
    return res.status(404).json({ err: "Toy not found" })
  }
  return res.status(403).json({ err: "This toy belongs to another user" })
}

module.exports = router;
