// Promote an existing user to admin (signup can't create admins)
// usage: npm run make-admin -- someone@example.com
require("dotenv").config({ quiet: true })
const mongoose = require("mongoose");
const { UserModel } = require("../models/userModel");

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) throw new Error("usage: npm run make-admin -- <email>");
  if (!process.env.MONGO_DB) throw new Error("MONGO_DB is missing (see .env.example)");
  await mongoose.connect(process.env.MONGO_DB);
  const data = await UserModel.updateOne({ email }, { role: "admin" });
  console.log(data.matchedCount ? "role admin set for " + email : "user not found: " + email);
  await mongoose.disconnect();
}

main().catch(err => { console.log(err); process.exit(1); });
