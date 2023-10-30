const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
  const { search } = req.query;
  try {
    const geoData = await geocoder
      .forwardGeocode({
        query: search,
        limit: 1,
      })
      .send();
    const data = geoData.body.features[0].geometry.coordinates;
    const campgrounds = await Campground.find({
      geometry: { $nearSphere: { coordinates: data }, $maxDistance: 50000 },
    });
    if (campgrounds.length) {
      res.render("campgrounds/nearestResult", { campgrounds, search });
    } else {
      throw error;
    }
  } catch {
    const campgrounds = await Campground.find({}).sort({ createdAt: -1 });
    if (!req.query.page) {
      const altCamp = await Campground.paginate(
        {},
        { limit: 8, sort: { createdAt: -1 } }
      );
      res.render("campgrounds/index", { altCamp, campgrounds, search });
    } else {
      const { page } = req.query;
      const altCamp = await Campground.paginate({}, { page });
      res.status(200).json(altCamp);
    }
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  if (!geoData.body.features[0]) {
    req.flash("error", "Unable to find location!");
    res.redirect(`/campgrounds/new`);
  }
  req.body.campground.location = geoData.body.features[0].place_name;
  if (req.files.length >= 1 && geoData.body.features.length) {
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    campground.author = req.user._id;
    await campground.save();
    req.flash("success", "New campground created!");
    res.redirect(`/campgrounds/${campground._id}`);
  } else {
    req.flash("error", "Image required!");
    res.redirect("/campgrounds/new");
  }
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("author");
  const review = req.query.data;
  if (!campground) {
    req.flash("error", "Unable to find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground, review });
};

module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    req.flash("error", "Unable to find that campground!");
    res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  if (!geoData.body.features[0]) {
    req.flash("error", "Unable to find location!");
    res.redirect(`/campgrounds/${id}/edit`);
  }
  req.body.campground.location = geoData.body.features[0].place_name;
  req.body.campground.geometry = geoData.body.features[0].geometry;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  const imgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.images.push(...imgs);
  if (req.body.deleteImages) {
    if (campground.images.length <= req.body.deleteImages.length) {
      req.flash("error", "Can not delete all images!");
      res.redirect(`/campgrounds/${campground._id}/edit`);
    } else {
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      await campground.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } },
      });
    }
  }
  await campground.save();
  req.flash("success", "Updated campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndDelete(id);
  for (let image of campground.images)
    await cloudinary.uploader.destroy(image.filename);
  req.flash("success", "Campground deleted!");
  res.redirect("/campgrounds");
};
