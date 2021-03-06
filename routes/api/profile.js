const express = require("express");
const request = require("request");
require("dotenv").config();
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator/check");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/post");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./public/",
  filename: function(req, file, cb) {
    cb(null, "IMAGE-" + Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  }
});

// router.post(
//   "/profilePhoto",
//   auth,
//   upload.single("photo"),
//   async (req, res, next) => {
//     const url = req.protocol + "://" + req.get("host");
//     console.log("Request file ---", req.file);

//     try {
//       // Using upsert option (creates new doc if no match is found):
//       let profile = await Profile.findOneAndUpdate(
//         { user: req.user.id },
//         { photo: url + "/public/" + req.file.filename },
//         { new: true, upsert: true }
//       );
//       res.json(profile);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send("Server Error");
//     }
//   }
// );

//upload profile image for user
router.post(
  "/profilePhoto",
  auth,
  upload.single("photo"),
  async (req, res, next) => {
    const url = req.protocol + "://" + req.get("host");
    console.log("Request file ---", req.file);

    try {
      // Using upsert option (creates new doc if no match is found):
      let user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { userphoto: url + "/public/" + req.file.filename },
        { new: true, upsert: true }
      );
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["fname", "lname", "email", "userphoto"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  "/",
  [
    auth
    // [
    //   check("status", "Status is required")
    //     .not()
    //     .isEmpty(),
    //   check("skills", "Skills is required")
    //     .not()
    //     .isEmpty()
    // ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      dob,
      location,
      phone,
      occupation,
      website,
      bio,
      facebook,
      instagram
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (dob) profileFields.dob = dob;
    if (location) profileFields.location = location;
    if (phone) profileFields.phone = phone;
    if (occupation) profileFields.occupation = occupation;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    profileFields.updated = Date.now();
    // Build social object
    profileFields.social = {};
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", [
      "fname",
      "lname",
      "email",
      "userphoto"
    ]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["fname", "lname", "email", "userphoto"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

router.get("/postUser/:user_id", async (req, res) => {
  try {


    var search = req.params.user_id;
    var para = search.split(",");

    let arr = para.map(ele => new mongoose.Types.ObjectId(ele));

    // console.log(arr)

  //   model.find({
  //     '_id': { $in: [
  //         mongoose.Types.ObjectId('4ed3ede8844f0f351100000c'),
  //         mongoose.Types.ObjectId('4ed3f117a844e0471100000d'), 
  //         mongoose.Types.ObjectId('4ed3f18132f50c491100000e')
  //     ]}
  // }, function(err, docs){
  //      console.log(docs);
  // });


  const postProfiles = await Profile.find({
    'user': { $in: arr}
  }).populate("user", ["fname", "lname", "email", "userphoto"]);

  

    // const postProfiles = await Profile.find({
    //   user: req.params.user_id
    // }).populate("user", ["fname", "lname", "email", "userphoto"]);

    if (!postProfiles) return res.status(400).json({ msg: "Profile not found" });
  console.log(postProfiles)
    res.json(postProfiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profiles not found" });
    }
    res.status(500).send("Server Error");
  }
});


// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete("/", auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/profile/portfolio
// @desc     Add profile portfolio
// @access   Private
router.put(
  "/portfolio",
  [
    auth,
    [
      // check("title", "Title is required")
      //   .not()
      //   .isEmpty()
    ]
  ],
  upload.array("imgCollection", 6),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const url = req.protocol + "://" + req.get("host");

    const { title, description } = req.body;

    const newPortfolio = {};
    if (title) newPortfolio.title = title;
    if (description) newPortfolio.description = description;
    if (req.files.length != 0) {
      newPortfolio.imgCollection = [];
      for (var i = 0; i < req.files.length; i++) {
        newPortfolio.imgCollection.push(
          url + "/public/" + req.files[i].filename
        );
      }
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.portfolio.unshift(newPortfolio);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    PUT api/profile/portfolio/:portf_id
// @desc     Edit profile portfolio with no newly added pictures
// @access   Private
router.put("/portfolio/:portf_id", auth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { newTitle, newDescription, prevImgCollection } = req.body;

  // Build portfolio object
  const portfolioFields = {};
  if (newTitle) portfolioFields.title = newTitle;
  if (newDescription) portfolioFields.description = newDescription;
  if (prevImgCollection) portfolioFields.imgCollection = prevImgCollection;

  try {
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id, "portfolio._id": req.params.portf_id },
      { $set: { "portfolio.$": portfolioFields } },
      { new: true }
    );
    res.json(profile);
    // }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/profile/portfolio/:portf_id
// @desc     Edit profile portfolio with newly added pictures
// @access   Private
router.put(
  "/portfolioPhoto/:portf_id",
  auth,
  upload.array("imgCollection", 6),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const url = req.protocol + "://" + req.get("host");

    const { newTitle, newDescription, prevImgCollection } = req.body;

    const portfolioFields = {};
    if (newTitle) portfolioFields.title = newTitle;
    if (newDescription) portfolioFields.description = newDescription;

    if (req.files.length != 0) {
      portfolioFields.imgCollection = [];
      for (var i = 0; i < req.files.length; i++) {
        portfolioFields.imgCollection.push(
          url + "/public/" + req.files[i].filename
        );
      }
    }
    if (prevImgCollection) {
      var preImg = prevImgCollection.split(",");

      preImg.forEach(element => portfolioFields.imgCollection.push(element));
    }

    try {
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id, "portfolio._id": req.params.portf_id },
        { $set: { "portfolio.$": portfolioFields } },
        { new: true, upsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete("/portfolio/:portf_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });
    const portfolioIds = foundProfile.portfolio.map(portf =>
      portf._id.toString()
    );

    const removeIndex = portfolioIds.indexOf(req.params.portf_id);
    if (removeIndex === -1) {
      return res.status(500).json({ msg: "Server error" });
    } else {
      foundProfile.portfolio.splice(removeIndex, 1);
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route    POST api/profile/addContact
// @desc     Add friend
// @access   Public

router.post("/addContact",
  [
    auth
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { contact } = req.body;
    console.log(req.body)
    try {
      let user = await User.findOne({ _id: req.user.id });
      if (user) {
        user.contact.push(contact);
        user.save();
        res.status(200).json({ success: 'Done' })
      } else {
        return res.status(401).json({ errors: "User not found" });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);


// @route    POST api/profile/contacts
// @desc     Get all friends
// @access   Public

router.get("/contacts",
  [
    auth
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await User.findOne({ _id: req.user.id });
      if(user) {
        const profiles = await Profile.find({'_id' : { $in: user.contact}}).populate("user", [
          "fname",
          "lname",
          "email",
          "userphoto"
        ]);
        res.json(profiles);
      //  console.log(profiles);
      }
     
  } catch (err) {
    res.status(500).send("Server Error");
  }
  }
);

// @route    DELETE api/profile/deleteContact/:id
// @desc     Delete contact
// @access   Private

router.delete("/deleteContact/:id",
  [
    auth
  ], async (req, res) => {
    try{
      let user = await User.findOne({ _id: req.user.id });
      let userID = req.params.id;
      let profileID = await Profile.findOne({ user: userID});
      const contacts = user.contact;
      console.log(contacts);

      for(var i = 0; i < contacts.length; i++) {
       //console.log("TYPE OF", typeof contacts[i].toString());
       if(contacts[i] != null) { 
        if(contacts[i].toString() == profileID._id.toString())
         {
          contacts.splice(i, 1);
         }
        }
      }
      await user.save();
      console.log(contacts);
      return res.status(200).json("Success");
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    POST api/profile/notification
// @desc     Get all notification
// @access   Public
router.get("/notification",
  [
    auth
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try{
      let profile = await Profile.findOne({ user: req.user.id });
      if(profile) {
        const postsIDs = profile.notification.map(({postReference}) => postReference);
        const posts = await Post.find({'_id' : { $in: postsIDs }}).populate("user", [
          "fname",
          "lname",
          "email",
          "userphoto"
        ]); 
        
       /* const temp = [];

        posts.forEach((post) => (temp.push({
          post,
          notification: notification.filter(({ postReference}) => postReference.toString() == this.post._id)
        })));
        res.json(temp);
        */
       //const notification = profile.notification;
        res.json(posts);
       // console.log("NOTIFICATION POSTS", notification);
      }
    } catch (err) {
      res.status(500).send("Server Error");
    }
  }
);
/*
router.get("/notification",
  [
    auth
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try{
      let profile = await Profile.findOne({ user: req.user.id });
      if(profile) {
       // const profile = await Profile.findOne
        const posts = await Post.find({'_id' : { $in: profile.notification}}).populate("user", [
          "fname",
          "lname",
          "email",
          "userphoto"
        ]); 
        
       //const notification = profile.notification;
        res.json(posts);
       // console.log("NOTIFICATION POSTS", notification);
      }
    } catch (err) {
      res.status(500).send("Server Error");
    }
  }
);
*/
// @route    POST api/profile/deleteNotification/:id
// @desc     Delete notification
// @access   Public
router.delete("/deleteNotification/:id",
  [
    auth
  ], async (req, res) => {
    try{
      let profile = await Profile.findOne({ user: req.user.id });
      const notification = profile.notification;

      for(var i = 0; i < notification.length; i++) {
        if(notification[i] != null){
          if(notification[i]){
            notification.splice(i, 1);
          }
        }
      }
      await profile.save();
      return res.status(200).json("Success");
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

/*
// @route    POST api/profile/addNotification
// @desc     Add notification
// @access   Public

router.post("/addNotification",
  [
    auth
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //const post = await Post.findOne({ _id : req.body});
   // console.log("POST INFO", post);
    const { notification } = req.body;
    console.log("NOTIFICATIONS",req.body)
    try {
      let profile = await Profile.findOne({ user: req.user.id});
      if(profile) {
        profile.notification.push(notification);
        profile.save();
        res.status(200).json({ success: 'Done' })
      } else {
        return res.status(401).json({ errors: "User not found" });
      }  
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    }
);
*/

module.exports = router;
