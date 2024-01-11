if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Gym = require("../models/gym");
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
  // await Gym.deleteMany({});
  for (let i = 0; i < 77; i++) {
    // const random1000 = Math.floor(Math.random() * 1000);
    // const price = Math.floor(Math.random() * 20) + 10;
    const geoData = await geocoder
      .forwardGeocode({
        query: seeds[i].location,
        limit: 1,
      })
      .send();
    const gym = new Gym({
      author: "6537e69145fba74eca488893",
      location: geoData.body.features[0].place_name,
      title: seeds[i].title,
      description: seeds[i].description,
      price: seeds[i].price,
      geometry: {
        type: "Point",
        coordinates: geoData.body.features[0].geometry.coordinates,
      },
      images: [images[i % 18]],
    });
    await gym.save();
    // const gyms = await Gym.find({});

    // for (let i = 0; i < gyms.length; i++) {
    //   gyms[i].images.push(images[i % 9]);
    //   await gyms[i].save();
    // }
  }
};
seedDB().then(() => {
  mongoose.connection.close();
});
