import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getProductsEndpoint = "api/homeSlides";

const localBase = "http://localhost:8800";
const createProductEndpoint = "api/homeSlides/add";

async function syncProducts() {
  try {
    const res = await axios.get(`${clientBase}/${getProductsEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log("res data:", res.data);

    const slides = res.data.data;

    if (!Array.isArray(slides)) {
      throw new Error("slides array not found in res.data");
    }

    for (const slide of slides) {
      const payload = {
        images: slide.images,
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

        console.log("➡️ Synced slide:", localRes.data);
      } catch (err) {
        console.error("❌ Error syncing slide:", slide._id, err.message);
      }
    }

    console.log("🎉 Slides sync complete");
  } catch (err) {
    console.error("❌ Error fetching slides:", err.message);
  }
}

syncProducts();
