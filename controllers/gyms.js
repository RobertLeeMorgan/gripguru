const Gym = require("../models/gym");
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
    const gyms = await Gym.find({
      geometry: { $nearSphere: { coordinates: data }, $maxDistance: 50000 },
    });
    if (gyms.length) {
      res.render("gyms/nearestResult", { gyms, search });
    } else {
      throw error;
    }
  } catch {
    const gyms = await Gym.find({}).sort({ createdAt: -1 });
    if (!req.query.page) {
      const altGym = await Gym.paginate(
        {},
        { limit: 8, sort: { createdAt: -1 } }
      );
      res.render("gyms/index", { altGym, gyms, search });
    } else {
      const { page } = req.query;
      const altGym = await Gym.paginate(
        {},
        { page, limit: 8, sort: { createdAt: -1 } }
      );
      res.status(200).json(altGym);
    }
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("gyms/new");
};

module.exports.createGym = async (req, res) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.gym.location,
      limit: 1,
    })
    .send();
  if (!geoData.body.features[0]) {
    req.flash("error", "Unable to find location!");
    res.redirect(`/gyms/new`);
  }
  req.body.gym.location = geoData.body.features[0].place_name;
  if (req.files.length >= 1 && geoData.body.features.length) {
    const gym = new Gym(req.body.gym);
    gym.geometry = geoData.body.features[0].geometry;
    gym.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    gym.author = req.user._id;
    await gym.save();
    req.flash("success", "New boulder gym created!");
    res.redirect(`/gyms/${gym._id}`);
  } else {
    req.flash("error", "Image required!");
    res.redirect("/gyms/new");
  }
};

module.exports.showGym = async (req, res) => {
  const gym = await Gym.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("author");
  const review = req.query.data;
  if (!gym) {
    req.flash("error", "Unable to find that boulder gym!");
    return res.redirect("/gyms");
  }
  res.render("gyms/show", { gym, review });
};

module.exports.renderEditForm = async (req, res) => {
  const gym = await Gym.findById(req.params.id);
  if (!gym) {
    req.flash("error", "Unable to find that boulder gym!");
    res.redirect("/gyms");
  }
  res.render("gyms/edit", { gym });
};

module.exports.updateGym = async (req, res) => {
  const { id } = req.params;
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.gym.location,
      limit: 1,
    })
    .send();
  if (!geoData.body.features[0]) {
    req.flash("error", "Unable to find location!");
    res.redirect(`/gyms/${id}/edit`);
  }
  req.body.gym.location = geoData.body.features[0].place_name;
  req.body.gym.geometry = geoData.body.features[0].geometry;
  const gym = await Gym.findByIdAndUpdate(id, {
    ...req.body.gym,
  });
  const imgs = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  gym.images.push(...imgs);
  if (req.body.deleteImages) {
    if (gym.images.length <= req.body.deleteImages.length) {
      req.flash("error", "Can not delete all images!");
      res.redirect(`/gyms/${gym._id}/edit`);
    } else {
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      await gym.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } },
      });
    }
  }
  await gym.save();
  req.flash("success", "Updated gym!");
  res.redirect(`/gyms/${gym._id}`);
};

module.exports.deleteGym = async (req, res) => {
  const { id } = req.params;
  const gym = await Gym.findByIdAndDelete(id);
  for (let image of gym.images)
    await cloudinary.uploader.destroy(image.filename);
  req.flash("success", "Boulder gym deleted!");
  res.redirect("/gyms");
};
