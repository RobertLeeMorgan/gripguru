const Review = require("../models/review");
const Campground = require("../models/gym");

module.exports.createReview = async (req, res) => {
  if (req.body.review.rating < 1) {
    req.flash("error", "Rating can not be 0!");
    return res.redirect(
      `/gyms/${req.params.id}/?data=${req.body.review.body}`
    );
  }
  const gym = await Campground.findById(req.params.id);
  const reviewIds = gym.reviews
  const userId= req.user._id
  const alreadyReviewed = await Review.find({$and: [{_id: { $in: reviewIds }}, { author: userId}]});
  if (!alreadyReviewed.length) {
    const review = new Review(req.body.review);
    review.author = userId;
    gym.reviews.push(review);
    await review.save();
    await gym.save();
    req.flash("success", "Created new review!");
    res.redirect(`/gyms/${gym._id}`);
  } else {
    req.flash("error", "You can only leave 1 review per campsite!");
    res.redirect(`/gyms/${gym._id}`);
  }
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted!");
  res.redirect(`/gyms/${id}`);
};
