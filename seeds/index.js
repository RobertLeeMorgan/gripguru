if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Campground = require("../models/campground");
const { images } = require("./images");
const { seeds } = require("./seedHelpers");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

const seedDB = async () => {
  // await Campground.deleteMany({});
  for (let i = 0; i < 99; i++) {
    // const random1000 = Math.floor(Math.random() * 1000);
    // const price = Math.floor(Math.random() * 20) + 10;
    const geoData = await geocoder
      .forwardGeocode({
        query: seeds[i].location,
        limit: 1,
      })
      .send();
    const camp = new Campground({
      author: "6537e69145fba74eca488893",
      location: geoData.body.features[0].place_name,
      title: seeds[i].title,
      description: seeds[i].description,
      price: seeds[i].price,
      geometry: {
        type: "Point",
        coordinates: geoData.body.features[0].geometry.coordinates,
      },
      images: [images[i % 16]],
    });
  // const campgrounds = await Campground.find({});

  // for (let i = 0; i < campgrounds.length; i++) {
  //   campgrounds[i].images.push(images[i % 9]);
  //   await campgrounds[i].save();
  // }
};
seedDB().then(() => {
  mongoose.connection.close();
});
