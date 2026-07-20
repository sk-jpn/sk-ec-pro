const K_ROOM_CODES=new Set(["K101","K102","K103","K302"]);
const F_ROOM_CODES=new Set(["F101","F102","F201","F202","F203","F205","F301","F302"]);
export const FIXED_ROUTE_ROOM_CODES=new Set([...K_ROOM_CODES,...F_ROOM_CODES]);

const K_ROOM_FIXED_ROUTES=[
  {id:"kasai-stations",label:"葛西駅／浦安駅／葛西臨海公園駅",oneWay:1000},
  {id:"tokyo-disney-resort",label:"東京ディズニーリゾート",oneWay:2000,roundTrip:3000},
  {id:"narita-airport",label:"成田空港（高速料金込み）",oneWay:18000},
  {id:"haneda-airport",label:"羽田空港",oneWay:8000},
] as const;
const F_ROOM_FIXED_ROUTES=[
  {id:"narita-airport",label:"成田空港（高速料金込み）",oneWay:16000},
  {id:"haneda-airport",label:"羽田空港",oneWay:10000},
] as const;

export function getFixedRoutesForRoom(roomCode:string){
  if(K_ROOM_CODES.has(roomCode))return K_ROOM_FIXED_ROUTES;
  if(F_ROOM_CODES.has(roomCode))return F_ROOM_FIXED_ROUTES;
  return [];
}
export function getFixedRouteForRoom(roomCode:string,id:string){return getFixedRoutesForRoom(roomCode).find(route=>route.id===id)}
