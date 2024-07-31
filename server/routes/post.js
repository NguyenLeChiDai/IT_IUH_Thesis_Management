const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const Post = require("../models/Post");

//@route GET api/posts
//@desc GET post
//@access private

router.get("/", verifyToken, async (req, res) => {
  try {
    //get user và chỉ lấy username
    const posts = await Post.find({ user: req.userId }).populate("user", [
      "username",
    ]);

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

//@route POST api/posts
//@desc Create post
//@access private

router.post("/", verifyToken, async (req, res) => {
  const { title, description, url, status } = req.body;

  console.log("Request body:", req.body); // Thêm dòng log để kiểm tra

  // Simple validation
  if (!title) {
    return res
      .status(400)
      .json({ success: false, message: "Title is required" });
  }
  try {
    const newPost = new Post({
      title,
      description,
      url: url.startsWith("https://") ? url : `https://${url}`,
      status: status || "TO LEARN",
      user: req.userId,
    });

    await newPost.save();

    res.json({ success: true, message: "Happy learning!", post: newPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route put api/posts
//@desc update post
//@access private
//backend đăng thông tin khóa học

router.put("/:id", verifyToken, async (req, res) => {
  const { title, description, url, status } = req.body;

  if (!title)
    return res
      .status(400)
      .json({ access: false, message: "title is required" });

  try {
    let updatedPost = {
      title,
      description: description || "",
      url: (url.startsWith("https://") ? url : `https://${url}`) || "",
      status: status || "TO LEARN",
    };

    // điều kiện để thay đổi post (phải có _id, userid người dùng)
    const postUpdateCondition = { _id: req.params.id, user: req.userId };
    updatedPost = await Post.findOneAndUpdate(
      postUpdateCondition,
      updatedPost,
      {
        new: true,
      }
    ); //tham số là điều kiện và dữ liệu thay đổi sau đó có new true để ghi dl vào updatePost

    //User not authrised to update post or post not found
    if (!updatedPost)
      return res.status(401).json({
        success: false,
        message: "post not pound or user not authorised",
      });

    // nếu update thành cônng
    res.json({
      success: true,
      message: "Bạn đã cập nhật thành công khóa học!",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server orror" });
  }
});

//  @router DELETE / api.posts
// @desc Delete post
// @access Private

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const postDeleteCondition = { _id: req.params.id, user: req.userId };
    const deletePost = await Post.findOneAndDelete(postDeleteCondition);

    //nguời dùng không được ủy quyền hoặc không tìm thấy post
    if (!deletePost)
      return res.status(401).json({
        success: false,
        message: "post not pound or user not authorised",
      });

    res.json({ success: true, post: deletePost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server orror" });
  }
});
module.exports = router;
