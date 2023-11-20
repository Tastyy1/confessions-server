import { Router } from "express";
import { searchLimiter } from "../middleware/rate-limit.js";
import Post from "../models/Post.js";

const router = Router();

router.get("/", searchLimiter, async (req, res) => {
  try {
    const { q, sort } = req.query;

    // Boş sorgu kontrolü
    if (!q) {
      return res.status(200).json({
        status: "success",
        message: "Empty query",
        data: [],
      });
    }

    const regexQuery = {
      $or: [
        { name: { $regex: q, $options: "i" } }, // "i" seçeneği büyük-küçük harf duyarlılığını kaldırır
        { body: { $regex: q, $options: "i" } },
      ],
      "meta.isDeleted": false,
    };

    const projection = {
      name: 1,
      body: 1,
      count: 1,
      engagement: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const limitStage = {
      $limit: 30,
    };

    const pipeline = [
      { $match: regexQuery },
      { $project: projection },
      limitStage,
    ];

    if (sort === "top") {
      pipeline.splice(1, 0, {
        $sort: {
          engagement: -1,
        },
      });
    }

    const result = await Post.aggregate(pipeline);

    res.status(200).json({
      status: "success",
      message: "Search results",
      data: result,
    });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({
      status: "error",
      message: `Error searching - ${err.message}`,
      data: null,
    });
  }
});

export default router;
