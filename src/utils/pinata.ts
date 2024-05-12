const axios = require("axios");
require("dotenv").config();

const PINATA_JWT = process.env.PINATA_JWT_TOKEN;
const PINATA_API_BASE_URL = "https://api.pinata.cloud";
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

export async function saveDataToPinata(data: any) {
  try {
    const response = await axios.post(
      `${PINATA_API_BASE_URL}/pinning/pinJSONToIPFS`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error saving data to Pinata:", error);
    throw new Error("Failed to save data to Pinata");
  }
}

export const pinFileToIpfs = async (file, metaData) => {
  try {
    const data = new FormData();

    data.append("file", file);

    const metadata = JSON.stringify({
      name: "File name",
    });

    data.append("pinataMetadata", metadata);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: data,
    });

    if (!res.ok) {
      const errorResponse = await res.json();
      throw new Error(`Failed to save data to Pinata: ${errorResponse.error}`);
    }

    const resData = await res.json();
    console.log("File uploaded, CID:", resData.IpfsHash);

    return resData.IpfsHash;
  } catch (error) {
    console.error("Error saving data to Pinata:", error);
    throw error;
  }
};

export const pinDataOnIPFs = async (data: any) => {
  try {
    const jsonData = {
      pinataMetadata: {
        name: new Date(),
        keyvalues: {
          ItemID: `Bulkmailer`,
        },
      },
      pinataContent: {
        data
      },
    };

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify(jsonData),
    });

    if (!res.ok) {
      throw new Error(`Failed to save data to Pinata: ${res.statusText}`);
    }

    const resData = await res.json();

    console.log(resData);

    return resData;
  } catch (error) {
    console.error("Error saving data to Pinata:", error);
  }
};

export async function retrieveDataFromPinata(ipfsHash) {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_PINATA_GATEWAY_URL}/ipfs/${ipfsHash}?pinataGatewayToken=${process.env.REACT_APP_PINATA_GATEWAY_TOKEN}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve data from Pinata: ${response.statusText}`
      );
    }

    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error("Error retrieving data from Pinata:", error);
    throw new Error("Failed to retrieve data from Pinata");
  }
}
export async function retrieveAllDataFromPinata() {
  try {
    const response = await fetch(
      `https://api.pinata.cloud/data/pinList/?pinataGatewayToken=${process.env.REACT_APP_PINATA_GATEWAY_TOKEN}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve data from Pinata: ${response.statusText}`
      );
    }

    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error("Error retrieving data from Pinata:", error);
    throw new Error("Failed to retrieve data from Pinata");
  }
}
