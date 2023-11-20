import { Router } from "express";
import { searchLimiter } from "../middleware/rate-limit.js";
import Post from "../models/Post.js";

const router = Router();

// Veritabanında metin indeksi oluşturmak için bu adımı gerçekleştirebilirsiniz
// Bu adım sadece bir kere yapılmalıdır
// Örneğin, terminalde "mongo" komutunu kullanarak MongoDB'ye bağlanın ve aşağıdaki komutu girin:
// db.posts.createIndex({ name: "text", body: "text" });

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

  try {
    const result = await Post.aggregate([
      {
        $match: {
          $and: [
            {
              $text: {
                $search: q,
                $caseSensitive: false,
              },
            },
            { "meta.isDeleted": false },
          ],
        },
      },
      {
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
      },
      {
        $limit: 30,
      },
      sort === "top"
        ? {
            $sort: {
              engagement: -1,
            },
          }
        : {}, // Eğer sıralama isteği "top" ise sıralamayı ekleyin, değilse eklemeyin
    ]);

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
