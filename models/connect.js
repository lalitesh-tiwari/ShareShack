const mongoose = require("mongoose");

try {
  mongoose.connect("mongodb://127.0.0.1:27017/ShareShack");
  console.log("Database Created!");
} catch (error) {
  console.log(error);
}
