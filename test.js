import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const GetEndpoints = "api/category";
const clientBase = "https://serviceapi.spicezgold.com";
const localBase = "http://localhost:8800";
const PostEndpoints = "api/category/create";

async function syncData() {
  try {
    const res = await axios.get(`${clientBase}/${GetEndpoints}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log("res : ", res.data);

    const categories = res.data.data;
    if (!Array.isArray(categories)) {
      throw new Error("categories array not found in res.data");
    }

    for (const category of categories) {
      const payload = {
        name: category.name,
        images: category.images,
        parentId: category.parentId,
        parentCatName: category.parentCatName || null,
      };
      console.log("payload : ", payload);
      const localRes = await axios.post(
        `${localBase}/${PostEndpoints}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("localRes : ", localRes.data);
    }

    console.log("🎉 Sync complete");
  } catch (err) {
    console.error("error 1 : ", err);
  }
}

syncData();
