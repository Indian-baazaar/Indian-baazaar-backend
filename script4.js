import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getProductsEndpoint = "api/blog";

const localBase = "http://localhost:8800";
const createProductEndpoint = "api/blog/add";

async function syncBlogs() {
  try {
    const res = await axios.get(`${clientBase}/${getProductsEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const blogs = res.data?.blogs;
    if (!Array.isArray(blogs)) throw new Error("blogs array not found");

    for (const blog of blogs) {
      const payload = {
        title: blog.title ?? "",
        images: blog.images ?? [],
        description: blog.description ?? "",
      };
      console.log("payload : ",payload);
      try {
        const localRes = await axios.post(
          `${localBase}/${createProductEndpoint}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ Synced blog:", blog._id, localRes.data.message);
      } catch (err) {
        console.error("❌ Error syncing blog:", blog._id, err.message);
      }
    }

    console.log("🎉 All blogs synced successfully");
  } catch (err) {
    console.error("❌ Error fetching blogs:", err.message);
  }
}

syncBlogs();
