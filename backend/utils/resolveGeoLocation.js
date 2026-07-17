import { geocodeAddress } from "../service/geocode.js";
import CustomError from "./customError.js";

/**
 * Both Hospital and Pharmacy require a GeoJSON geoLocation to register, but the frontend can
 * only supply real device coordinates if the browser's geolocation permission is granted (it
 * commonly isn't — blocked by policy, denied by the user, or unavailable in embedded/headless
 * contexts). Fall back to geocoding the free-text address server-side via Mapbox so signup never
 * hard-blocks on browser location support.
 */
export async function resolveGeoLocation({ geoLocation, address }) {
  const coords = geoLocation?.coordinates;
  if (Array.isArray(coords) && coords.length === 2 && coords.every((n) => typeof n === "number" && !Number.isNaN(n))) {
    return { type: "Point", coordinates: coords };
  }

  if (!address) {
    throw new CustomError(400, "Location is required: provide geoLocation coordinates or an address to geocode.");
  }

  let point;
  try {
    point = await geocodeAddress(address);
  } catch (err) {
    throw new CustomError(400, `Could not determine location from address: ${err.message}`);
  }
  if (!point) {
    throw new CustomError(400, "Could not find that address. Please check it or share your device location instead.");
  }
  return point;
}
