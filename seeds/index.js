const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");

mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 200; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: "6532c5b77a5f320384982e31",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/dkni8tivd/image/upload/v1697981446/YelpCamp/f9csqpq9bcfoa3600eyh.jpg",
          filename: "YelpCamp/hcvzuggrw6zzerhhu4ez",
        },
        {
          url: "https://res.cloudinary.com/dkni8tivd/image/upload/v1697981448/YelpCamp/hcvzuggrw6zzerhhu4ez.jpg",
          filename: "YelpCamp/f9csqpq9bcfoa3600eyh",
        },
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse voluptatibus ab quae quos reiciendis, inventore iure in, facere expedita aspernatur eius vitae? Possimus nostrum corrupti aperiam voluptatem veritatis, rerum laborum.",
      price,
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
