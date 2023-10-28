const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200,h_120,c_limit");
});

ImageSchema.virtual("index").get(function () {
  return this.url.replace("/upload", "/upload/h_250,w_400,c_fill");
});

ImageSchema.virtual("show").get(function () {
  return this.url.replace("/upload", "/upload/h_400,w_600,c_fill");
});

const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema(
  {
    title: String,
    images: {
      type: [ImageSchema],
      required: true,
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    price: Number,
    description: String,
    location: String,
    createdAt: { type: Date, default: Date.now },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  opts
);

CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return `
  <h4><a href="/campgrounds/${this._id}">${this.title}</a></h4>
  <p>${this.description.substring(0, 60)}...</p>`;
});

CampgroundSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});

CampgroundSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("Campground", CampgroundSchema);
