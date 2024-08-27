const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    profiledp: {
      type: String,
      default: "default.png",
    },
    fullname: {
      type: String,
      required: [true, "Name is Required"],
      minLength: [3, "Name must be atleast 3 characters long"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is Required"],
      minLength: [3, "Username must be atleast 3 characters long"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is Required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    mobnumber: {
      type: String,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
      },
    ],
    resetPasswordToken: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(plm);

const User = mongoose.model("user", userSchema);

module.exports = User;
