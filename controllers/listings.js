const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  let allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }
  // console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  console.log(url, "..", filename);
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {
    url: url,
    filename: filename,
  };
  await newListing.save();
  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }
   let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
  res.render("listings/edit.ejs", { listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {
      url: url,
      filename: filename,
    };
    await listing.save();
  }
  req.flash("success", "Successfully updated a listing!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted a listing!");
  res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    req.flash("error", "Please enter a search term.");
    return res.redirect("/listings");
  }

  const listings = await Listing.find({
    $or: [
      { title: new RegExp(q, "i") },
      { location: new RegExp(q, "i") },
      { description: new RegExp(q, "i") }
    ]
  });

  if (listings.length === 0) {
    req.flash("error", `No results found for "${q}". Showing all listings.`);
    const allListings = await Listing.find({});
    return res.render("listings/index.ejs", { allListings, q: "" });
  }

  res.render("listings/index.ejs", { allListings: listings, q });
};


