import axios from "axios";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const GetEndpoints = [
  "api/category",
  "api/product/getAllProducts/getAllProductsBanners",
  "api/product/getAllProductsByRating",
  "api/product/getAllProductsByPrice",
  "api/product/getAllProductsCount",
  "api/product/getAllFeaturedProducts",
  "api/product/productWeight/get",
  "api/homeSlides",
  "api/bannerV1",
  "api/bannerList2",
  "api/blog",
  "api/logo"
];

const PostEndpoints = [
  "api/category/create",
  "api/product/getAllProducts/getAllProductsBanners",
  "api/product/getAllProductsByRating",
  "api/product/getAllProductsByPrice",
  "api/product/getAllProductsCount",
  "api/product/getAllFeaturedProducts",
  "api/product/productWeight/get",
  "api/homeSlides",
  "api/bannerV1",
  "api/bannerList2",
  "api/blog",
  "api/logo"
];

const clientBase = "https://serviceapi.spicezgold.com";
const localBase = "http://localhost:8800"; 

async function syncData() {
  for (const endpoint of GetEndpoints) {
    try {
      console.log(`⏳ Fetching ${endpoint}...`);

      const res = await axios.get(`${clientBase}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });

      if (res.status !== 200) {
        console.error(`❌ Failed GET ${endpoint}: ${res.status} ${res.statusText}`);
        continue;
      }

      const data = res.data;

      const postRes = await axios.post(`${localBase}/${endpoint}`, data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log("postRes : ", postRes);

      if (!postRes.ok) {
        console.error(`❌ Failed POST ${endpoint}: ${postRes.status} ${postRes.statusText}`);
        continue;
      }

      console.log(`✅ Synced ${endpoint}`);
    } catch (err) {
      console.error(`💥 Error with ${endpoint}:`, err.message);
    }
  }
}

syncData().then(() => console.log("🎉 Sync complete"));

