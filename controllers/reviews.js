const Review = require("../models/review");
const Campground = require("../models/campground");

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review);
  if (review.rating === 0) {
    req.flash("error", "Rating can not be 0!");
    return res.redirect(
      `/campgrounds/${campground._id}/?data=${req.body.review.body}`
    );
  }
  if (!campground.reviews.indexOf(req.user._id)) {
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash("success", "Created new review!");
    res.redirect(`/campgrounds/${campground._id}`);
  } else {
    req.flash("error", "You can only leave 1 review per campsite!");
    res.redirect(`/campgrounds/${campground._id}`);
  }
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted!");
  res.redirect(`/campgrounds/${id}`);
};
