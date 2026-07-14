// service/geocode.js
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding.js";

const token = process.env.MAPBOX_ACCESS_TOKEN;

let geocodingClient = null;
if (token) {
  geocodingClient = mbxGeocoding({ accessToken: token });
} else {
  console.warn("[geocode] MAPBOX_ACCESS_TOKEN not set — geocode will not work");
}

export async function geocodeAddress(address, limit = 1) {
  if (!geocodingClient) throw new Error("MAPBOX_ACCESS_TOKEN not configured");
  const response = await geocodingClient.forwardGeocode({
    query: address,
    limit,
  }).send();

  if (!response || !response.body || !response.body.features || response.body.features.length === 0) {
    return null;
  }

  // feature.geometry is { type: "Point", coordinates: [lng, lat] }
  return response.body.features[0].geometry;
}
