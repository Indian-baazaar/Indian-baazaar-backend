import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getProductsEndpoint = "api/product/getAllFeaturedProducts";

const localBase = "http://localhost:8800";

const createProductEndpoint = "api/product/create";

async function syncProducts() {
  try {
    const res = await axios.get(`${clientBase}/${getProductsEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const FeaturedProducts = res.data.products;

    if (!Array.isArray(FeaturedProducts))
      throw new Error("FeaturedProducts array not found");

    for (const banner of FeaturedProducts) {
      const payload = {
        name: banner.name,
        description: banner.description,
        images: banner.images ?? [],
        bannerimages: banner.bannerimages ?? [],
        bannerTitleName: banner.bannerTitleName ?? "",
        isDisplayOnHomeBanner: banner.isDisplayOnHomeBanner ?? false,
        brand: banner.brand ?? "",
        price: banner.price ?? 0,
        oldPrice: banner.oldPrice ?? 0,
        catName: banner.catName ?? "",
        category: banner.category?._id ?? "",
        catId: banner.catId ?? "",
        subCatId: banner.subCatId ?? "",
        subCat: banner.subCat ?? "",
        thirdsubCat: banner.thirdsubCat ?? "",
        thirdsubCatId: banner.thirdsubCatId ?? "",
        countInStock: banner.countInStock ?? 0,
        rating: banner.rating ?? 0,
        isFeatured: banner.isFeatured ?? false,
        discount: banner.discount ?? 0,
        productRam: banner.productRam ?? [],
        size: banner.size ?? [],
        productWeight: banner.productWeight ?? [],
      };

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
        console.log("✅ Synced banner:", localRes.data.message);
      } catch (err) {
        console.error("❌ Error syncing banner:", err.message);
      }
    }

    console.log("🎉 All FeaturedProducts synced successfully");
  } catch (err) {
    console.error("❌ Error fetching FeaturedProducts :", err.message);
  }
}

syncProducts();
