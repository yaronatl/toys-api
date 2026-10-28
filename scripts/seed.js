// Inserts sample toys: npm run seed (add -- --reset to recreate them)
require("dotenv").config({ quiet: true })
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { UserModel } = require("../models/userModel");
const { ToyModel } = require("../models/toyModel");
const toys = require("../json/seed_toys.json");

const SEED_EMAIL = "seed.owner@toys.example";

async function main() {
  if (!process.env.MONGO_DB) {
    throw new Error("MONGO_DB is missing - create the .env file (see .env.example)");
  }
  await mongoose.connect(process.env.MONGO_DB);
  await UserModel.init();
  let owner = await UserModel.findOne({ email: SEED_EMAIL });
  if (!owner) {
    // random password, printed once
    const password = crypto.randomBytes(9).toString("base64url");
    owner = new UserModel({ name: "Seed Owner", email: SEED_EMAIL, role: "user" });
    owner.password = await bcrypt.hash(password, 10);
    await owner.save();
    console.log("created seed user", SEED_EMAIL, "password (shown once):", password);
  }
  if (process.argv.includes("--reset")) {
    const del = await ToyModel.deleteMany({ user_id: String(owner._id) });
    console.log("deleted old seed toys:", del.deletedCount);
  }
  const already = await ToyModel.countDocuments({ user_id: String(owner._id) });
  if (already > 0) {
    console.log("seed toys already exist (" + already + "), use --reset to recreate");
  } else {
    await ToyModel.insertMany(toys.map(t => ({ ...t, user_id: String(owner._id) })));
    console.log("inserted toys:", toys.length);
  }
  await mongoose.disconnect();
}

main().catch(err => { console.log(err); process.exit(1); });
