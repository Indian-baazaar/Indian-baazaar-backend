import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

// Remote (client) API
const clientBase = "https://serviceapi.spicezgold.com";
const getProductsEndpoint = "api/product/getAllProducts";

// Local API
const localBase = "http://localhost:8800";
const createProductEndpoint = "api/product/create";

async function syncProducts() {
  try {
    const res = await axios.get(`${clientBase}/${getProductsEndpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      params: {
        page: 1,
        limit: 20,
      },
    });


    const products = res.data.products;

    if (!Array.isArray(products)) {
      throw new Error("products array not found in res.data");
    }

    for (const product of products) {
      const payload = {
        name: product.name,
        description: product.description,
        images: product.images,
        bannerimages: product.bannerimages,
        bannerTitleName: product.bannerTitleName,
        isDisplayOnHomeBanner: product.isDisplayOnHomeBanner,
        brand: product.brand,
        price: product.price,
        oldPrice: product.oldPrice,
        catName: product.catName,
        category: product.category,
        catId: product.catId,
        subCatId: product.subCatId,
        subCat: product.subCat,
        thirdsubCat: product.thirdsubCat,
        thirdsubCatId: product.thirdsubCatId,
        countInStock: product.countInStock,
        rating: product.rating,
        isFeatured: product.isFeatured,
        discount: product.discount,
        productRam: product.productRam,
        size: product.size,
        productWeight: product.productWeight,
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

        console.log("➡️ Synced:", localRes);
      } catch (err) {
        console.error("❌ Error syncing product:", product.name, err.message);
      }
    }

    console.log("🎉 Product sync complete");
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
  }
}

syncProducts();