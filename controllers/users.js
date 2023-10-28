const User = require("../models/user");

module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

module.exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    var regex = /^(?=.*\d)(?=.*[a-z])[a-zA-Z0-9]{6,}$/;
    if (!password.match(regex)) {
      throw new Error(
        "Password must be at least 6 characters, contain one uppercase letter, a lowercase letter, and a number!"
      );
    }
    if (username.length < 5) {
      throw new Error("Username must be at least 5 characters");
    }
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", `Welcome ${username}!`);
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const data = res.locals.review;
  const redirectUrl = res.locals.returnTo || "/campgrounds";
  if (redirectUrl.includes("/reviews")) {
    const url = redirectUrl.replace("/reviews", "");
    return res.redirect(`${url}/?data=${data}`);
  }
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye!");
    res.redirect("/campgrounds");
  });
};
