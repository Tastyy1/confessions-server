import { Router } from "express";
import { searchLimiter } from "../middleware/rate-limit.js";
import Post from "../models/Post.js";

const router = Router();

router.get("/", searchLimiter, async (req, res) => {
  const { q, sort } = req.query;

  // Boş sorgu kontrolü
  if (!q) {
    return res.status(200).json({
      status: "success",
      message: "Empty query",
      data: [],
    });
  }

  // Veritabanında "name" ve "body" alanlarında metin indeksi oluşturulmuş olmalı
  const textQuery = {
    $text: {
      $search: q,
      $caseSensitive: false,
    },
  };

  const matchQuery = {
    $match: {
      $and: [textQuery, { "meta.isDeleted": false }],
    },
  };

  const projection = {
    $project: {
      name: 1,
      body: 1,
      count: 1,
      engagement: 1,
      createdAt: 1,
      updatedAt: 1,
      score: {
        $meta: "textScore",
      },
    },
  };

  const limitStage = {
    $limit: 30,
  };

  const pipeline = [matchQuery, projection, limitStage];

  if (sort === "top") {
    pipeline.splice(1, 0, {
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
    console.error('Error searching:', err);
    res.status(500).json({
      status: "error",
      message: `Error searching - ${err.message}`,
      data: null,
    });
  }
});

export default router;
