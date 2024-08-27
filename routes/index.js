var express = require("express");
var router = express.Router();

const upload = require("../utils/multer");
const fs = require("fs");
const path = require("path");

const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));

const sendmail = require("../utils/nodemailer");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { user: req.user });
});

router.get("/register", function (req, res, next) {
  res.render("register", { user: req.user });
});

router.post("/register-user", async function (req, res, next) {
  try {
    const { fullname, username, email, mobnumber, password } = req.body;
    await User.register({ fullname, username, email, mobnumber }, password);
    res.redirect("/");
  } catch (error) {
    res.send(error);
  }
});

router.post(
  "/login-user",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const posts = await Post.find().populate("user");
  res.render("profile", { user: req.user, posts });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
  }
}

router.get("/logout", function (req, res, next) {
  req.logout(() => {
    res.redirect("/");
  });
});

router.get("/profile-update/:id", isLoggedIn, function (req, res, next) {
  res.render("profile-update", { user: req.user });
});

router.post(
  "/profile-dp/:id",
  isLoggedIn,
  upload.single("profiledp"),
  async function (req, res, next) {
    try {
      if (req.user.profiledp !== "default.png") {
        fs.unlinkSync(
          path.join(__dirname, "..", "public", "images", req.user.profiledp)
        );
      }
      req.user.profiledp = req.file.filename;
      await req.user.save();
      res.redirect(`/profile-update/${req.params.id}`);
    } catch (error) {
      res.send(error);
    }
  }
);

router.post("/update-profile/:id", isLoggedIn, async function (req, res, next) {
  try {
    const updateDetails = req.body;
    await User.findByIdAndUpdate(req.params.id, updateDetails);
    res.redirect(`/profile-update/${req.params.id}`);
  } catch (error) {
    res.send(error);
  }
});

router.get("/delete-user/:id", isLoggedIn, async function (req, res, next) {
  try {
    const deleteUser = await User.findByIdAndDelete(req.user.id);
    if (deleteUser.profiledp !== "default.png") {
      fs.unlinkSync(
        path.join(__dirname, "..", "public", "images", deleteUser.profiledp)
      );
    }

    deleteUser.posts.forEach(async (postid) => {
      const deletePost = await Post.findByIdAndDelete(postid);
      fs.unlinkSync(
        path.join(__dirname, "..", "public", "images", deletePost.media)
      );
    });

    res.redirect("/");
  } catch (error) {
    res.send(error);
  }
});

router.get("/reset-password/:id", isLoggedIn, function (req, res, next) {
  res.render("reset-password", { user: req.user });
});

router.post("/reset-password/:id", isLoggedIn, async function (req, res, next) {
  try {
    await req.user.changePassword(req.body.oldpassword, req.body.newpassword);
    req.user.save();
    res.redirect(`/profile-update/${req.user._id}`);
  } catch (error) {
    res.send(error);
  }
});

router.get("/forgot-email", function (req, res, next) {
  res.render("forgotemail", { user: req.user });
});

router.post("/forgotemail", async function (req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const url = `${req.protocol}://${req.get("host")}/forget-password/${
        user._id
      }`;
      sendmail(res, user, url);
    } else {
      res.redirect("/forgot-email");
    }
  } catch (error) {
    res.send(error);
  }
});

router.get("/forget-password/:id", async function (req, res, next) {
  res.render("forgetpassword", { user: req.user, id: req.params.id });
});

router.post("/forget-password/:id", async function (req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (user.resetPasswordToken == 1) {
      await user.setPassword(req.body.password);
      user.resetPasswordToken = 0;
      await user.save();
      res.redirect("/");
    } else {
      res.send("Link Expired or Try Again!");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/create-post", isLoggedIn, function (req, res, next) {
  res.render("createPost", { user: req.user });
});

router.post(
  "/create-post",
  isLoggedIn,
  upload.single("media"),
  async function (req, res, next) {
    try {
      const newpost = new Post({
        caption: req.body.caption,
        media: req.file.filename,
        user: req.user._id,
      });

      req.user.posts.push(newpost._id);

      await newpost.save();
      await req.user.save();

      res.redirect("/profile");
    } catch (error) {
      res.send(error);
    }
  }
);

router.get("/like/:postid", isLoggedIn, async function (req, res, next) {
  try {
    const post = await Post.findById(req.params.postid);

    // Check if the user already liked the post
    const likedIndex = post.likes.indexOf(req.user._id);
    if (likedIndex === -1) {
      // User did not like the post before, so add to likes
      post.likes.push(req.user._id);

      // Remove from unlikes if user was previously unliking it
      const unlikedIndex = post.unlikes.indexOf(req.user._id);
      if (unlikedIndex !== -1) {
        post.unlikes.splice(unlikedIndex, 1);
      }
    } else {
      // User already liked the post, so remove from likes
      post.likes.splice(likedIndex, 1);
    }

    await post.save();
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
});

router.get("/unlike/:postid", isLoggedIn, async function (req, res, next) {
  try {
    const post = await Post.findById(req.params.postid);

    // Check if the user already unliked the post
    const unlikedIndex = post.unlikes.indexOf(req.user._id);
    if (unlikedIndex === -1) {
      // User did not unlike the post before, so add to unlikes
      post.unlikes.push(req.user._id);

      // Remove from likes if user was previously liking it
      const likedIndex = post.likes.indexOf(req.user._id);
      if (likedIndex !== -1) {
        post.likes.splice(likedIndex, 1);
      }
    } else {
      // User already unliked the post, so remove from unlikes
      post.unlikes.splice(unlikedIndex, 1);
    }

    await post.save();
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
});

router.get("/mypost", isLoggedIn, async function (req, res, next) {
  try {
    res.render("mypost", { user: await req.user.populate("posts") });
  } catch (error) {
    res.send(error);
  }
});

router.get("/delete-post/:postid", isLoggedIn, async function (req, res, next) {
  try {
    const deletePost = await Post.findByIdAndDelete(req.params.postid);
    fs.unlinkSync(
      path.join(__dirname, "..", "public", "images", deletePost.media)
    );
    res.redirect("/mypost");
  } catch (error) {
    res.send(error);
  }
});

router.get("/upgrade-account/:userid", function (req, res, next) {
  res.render("upgrade-account", { user: req.user });
});

module.exports = router;
