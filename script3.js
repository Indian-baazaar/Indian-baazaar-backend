import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getProductsEndpoint = "api/bannerList2";

const localBase = "http://localhost:8800";
const createProductEndpoint = "api/bannerList2/add";

async function syncProducts() {
  try {
    const res = await axios.get(`${clientBase}/${getProductsEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const banners = res.data?.data;
    console.log("banners:", banners);
    if (!Array.isArray(banners)) throw new Error("banners array not found");

    for (const banner of banners) {
        console.log("banner item:", banner);
      const payload = {
        images: banner.images ?? [],
        catId: banner.catId ?? "",
        subCatId: banner.subCatId ?? "",
        thirdsubCatId: banner.thirdsubCatId ?? "",
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
        console.log("✅ Synced banner:", banner._id, localRes.data.message);
      } catch (err) {
        console.error("❌ Error syncing banner:", banner._id, err.message);
      }
    }

    console.log("🎉 All banners synced successfully");
  } catch (err) {
    console.error("❌ Error fetching banners:", err.message);
  }
}

syncProducts();
