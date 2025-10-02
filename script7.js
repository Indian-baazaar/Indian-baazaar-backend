import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getCategoriesEndpoint = "api/category";

const localBase = "http://localhost:8800";
const createCategoryEndpoint = "api/category/create";

async function syncCategories() {
  try {
    const res = await axios.get(`${clientBase}/${getCategoriesEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const categories = res.data.data;
    if (!Array.isArray(categories))
      throw new Error("categories array not found");

    const allCats = [];
    function walk(cat, parentName = null) {
      allCats.push({
        name: cat.name,
        images: cat.images ?? [],
        parentId: cat.parentId ?? null,
        parentCatName: parentName ?? cat.parentCatName ?? null,
      });

      // only recurse if children exists and is an array
      if (Array.isArray(cat.children) && cat.children.length > 0) {
        cat.children.forEach((child) => walk(child, cat.name));
      }
    }

    categories.forEach((cat) => walk(cat));

    for (const cat of allCats) {
    console.log("cat : ", cat);
      try {
        const localRes = await axios.post(
          `${localBase}/${createCategoryEndpoint}`,
          cat,
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ Synced category:", cat.name, localRes.data.message);
      } catch (err) {
        console.error("❌ Error syncing category:", cat.name, err.message);
      }
    }

    console.log("🎉 All categories synced successfully");
  } catch (err) {
    console.error("❌ Error fetching categories:", err.message);
  }
}

syncCategories();
