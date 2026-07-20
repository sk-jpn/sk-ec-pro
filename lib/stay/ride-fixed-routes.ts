export const FIXED_ROUTE_ROOM_CODES = new Set(["K101","K102","K103","K302"]);
export const RIDE_FIXED_ROUTES = [
  { id:"kasai-stations", label:"葛西駅／浦安駅／葛西臨海公園駅", oneWay:1000 },
  { id:"tokyo-disney-resort", label:"東京ディズニーリゾート", oneWay:2000, roundTrip:3000 },
  { id:"narita-airport", label:"成田空港（高速料金込み）", oneWay:18000 },
  { id:"haneda-airport", label:"羽田空港", oneWay:8000 },
] as const;
export function getFixedRoute(id:string){return RIDE_FIXED_ROUTES.find(route=>route.id===id)}

