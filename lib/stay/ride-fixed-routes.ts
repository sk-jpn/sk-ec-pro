export type FixedRouteOption = {
  id: string;
  label: string;
  pickup: string;
  destination: string;
  price: number;
  isRoundTrip?: boolean;
};

const F322_ADDRESS = "千葉県船橋市湊町3-22-12";
const F321_ADDRESS = "千葉県船橋市湊町3-21-1";
const K_ADDRESS = "東京都江戸川区東葛西4-43-5";

export function getStayAddress(roomCode: string): string {
  if (roomCode === "F322" || ["F101", "F102", "F301", "F302"].includes(roomCode)) return F322_ADDRESS;
  if (["F201", "F202", "F203", "F205"].includes(roomCode)) return F321_ADDRESS;
  if (["K101", "K102", "K103", "K302"].includes(roomCode)) return K_ADDRESS;
  return "";
}

export function getRoomGroup(roomCode: string): "F322-group" | "F321-group" | "K-group" | "" {
  if (roomCode === "F322" || ["F101", "F102", "F301", "F302"].includes(roomCode)) return "F322-group";
  if (["F201", "F202", "F203", "F205"].includes(roomCode)) return "F321-group";
  if (["K101", "K102", "K103", "K302"].includes(roomCode)) return "K-group";
  return "";
}

type RawRoute = {
  id: string;
  label: string;
  pickup?: string;
  destination?: string;
  price: number;
  isRoundTrip?: boolean;
};

const F_GROUP_ROUTES: RawRoute[] = [
  { id: "nrt-to-stay", label: "成田空港→滞在先", pickup: "成田空港", price: 16000 },
  { id: "stay-to-nrt", label: "滞在先→成田空港", destination: "成田空港", price: 16000 },
  { id: "hnd-to-stay", label: "羽田空港→滞在先", pickup: "羽田空港", price: 10000 },
  { id: "stay-to-hnd", label: "滞在先→羽田空港", destination: "羽田空港", price: 10000 },
];

const K_ROUTES: RawRoute[] = [
  { id: "station-to-stay", label: "最寄り駅→滞在先", pickup: "葛西駅", price: 1000 },
  { id: "stay-to-station", label: "滞在先→最寄り駅", destination: "葛西駅", price: 1000 },
  { id: "nrt-to-stay", label: "成田空港→滞在先", pickup: "成田空港", price: 18000 },
  { id: "stay-to-nrt", label: "滞在先→成田空港", destination: "成田空港", price: 18000 },
  { id: "hnd-to-stay", label: "羽田空港→滞在先", pickup: "羽田空港", price: 8000 },
  { id: "stay-to-hnd", label: "滞在先→羽田空港", destination: "羽田空港", price: 8000 },
  { id: "disney-round", label: "滞在先↔東京ディズニーリゾート 往復", pickup: "東京ディズニーリゾート", destination: "東京ディズニーリゾート", price: 3000, isRoundTrip: true },
  { id: "stay-to-disney", label: "滞在先→東京ディズニーリゾート", destination: "東京ディズニーリゾート", price: 2000 },
  { id: "disney-to-stay", label: "東京ディズニーリゾート→滞在先", pickup: "東京ディズニーリゾート", price: 2000 },
];

function fillRouteAddresses(routes: RawRoute[], address: string): FixedRouteOption[] {
  return routes.map((r) => ({
    ...r,
    pickup: r.pickup ?? address,
    destination: r.destination ?? address,
  }));
}

export function getFixedRoutes(roomCode: string): FixedRouteOption[] {
  const group = getRoomGroup(roomCode);
  if (!group) return [];
  const address = getStayAddress(roomCode);
  return fillRouteAddresses(group === "K-group" ? K_ROUTES : F_GROUP_ROUTES, address);
}

export function getFixedRouteById(roomCode: string, routeId: string): FixedRouteOption | undefined {
  return getFixedRoutes(roomCode).find((r) => r.id === routeId);
}

export function getFixedRouteLabel(roomCode: string, routeId: string): string | undefined {
  return getFixedRouteById(roomCode, routeId)?.label;
}