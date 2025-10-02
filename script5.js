import axios from "axios";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q2MGVkMjI4ZGI0NzliYjBkMjFmMSIsImlhdCI6MTc1ODM4MjU4MywiZXhwIjoxNzU4OTg3MzgzfQ.4Ir9lWXvGxg7M_QkLiMsUTNtc7fkA6wicFi6KbpAxFU";

const clientBase = "https://serviceapi.spicezgold.com";
const getLogoEndpoint = "api/logo";

const localBase = "http://localhost:8800";
const addLogoEndpoint = "api/logo/add";

async function syncLogos() {
  try {
    const res = await axios.get(`${clientBase}/${getLogoEndpoint}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const logos = res.data?.logo;
    if (!Array.isArray(logos)) throw new Error("logos array not found");

    for (const logoItem of logos) {
      const payload = {
        logo: logoItem.logo ?? "",
      };
      console.log("payload : ",payload);

      try {
        const localRes = await axios.post(
          `${localBase}/${addLogoEndpoint}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("✅ Synced logo:", logoItem._id, localRes.data.message);
      } catch (err) {
        console.error("❌ Error syncing logo:", logoItem._id, err.message);
      }
    }

    console.log("🎉 All logos synced successfully");
  } catch (err) {
    console.error("❌ Error fetching logos:", err.message);
  }
}

syncLogos();
