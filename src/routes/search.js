import { Router } from "express";
import { searchLimiter } from "../middleware/rate-limit.js";
import Post from "../models/Post.js";

const router = Router();

router.get("/", searchLimiter, async (req, res) => {
  const { q, sort } = req.query;

  const pipeline = [
    {
      $search: {
        text: {
          query: q,
          path: ["name", "body"],
          fuzzy: {
            maxEdits: 1,
          },
        },
      },
    },

    {
      $limit: 30,
    },
  ];

  if (sort === "top") {
    pipeline.push({
      $sort: {
        engagement: -1,
      },
    });
  }

  try {
    const result = await Post.aggregate(pipeline);
    res.status(200).json({
      status: "success",
      message: "Search results",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: `Error searching - ${err.message}`,
      data: null,
    });
  }
});

export default router;
