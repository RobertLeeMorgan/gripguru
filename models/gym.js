const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2')

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

const GymSchema = new Schema(
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

GymSchema.virtual("properties.popUpMarkup").get(function () {
  return `
  <h4><a href="/gyms/${this._id}">${this.title}</a></h4>
  <p>${this.description.substring(0, 60)}...</p>`;
});

GymSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});

GymSchema.index({ coordinates: "2dsphere" });

GymSchema.plugin(mongoosePaginate)

module.exports = mongoose.model("Gym", GymSchema);
