export type RidePricingSettings = {
  discount_percent: number;
  initial_distance_meters: number;
  initial_fare: number;
  additional_distance_meters: number;
  additional_fare: number;
  night_multiplier: number;
};

export const DEFAULT_RIDE_PRICING: RidePricingSettings = {
  discount_percent: 30,
  initial_distance_meters: 1000,
  initial_fare: 500,
  additional_distance_meters: 232,
  additional_fare: 100,
  night_multiplier: 1.2,
};

export function isNightRide(time: string) {
  const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return minutes >= 22 * 60 || minutes < 5 * 60;
}

export function calculateRideFare(distanceMeters: number, departureTime: string, settings: RidePricingSettings) {
  const distance = Math.max(0, Math.ceil(distanceMeters));
  const night = isNightRide(departureTime);
  const multiplier = night ? Number(settings.night_multiplier) : 1;
  const initialDistance = Number(settings.initial_distance_meters) / multiplier;
  const additionalDistance = Number(settings.additional_distance_meters) / multiplier;
  const additions = distance <= initialDistance ? 0 : Math.ceil((distance - initialDistance) / additionalDistance);
  const meterFare = Number(settings.initial_fare) + additions * Number(settings.additional_fare);
  const discountPercent = Math.min(100, Math.max(0, Number(settings.discount_percent)));
  const totalAmount = Math.round(meterFare * (100 - discountPercent) / 100);
  return { distanceMeters: distance, isNight: night, meterFare, discountPercent, discountAmount: meterFare - totalAmount, totalAmount };
}

