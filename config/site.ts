export const BASE_PATH = "/ec";
export const SITE_ORIGIN = "https://formosajapan.com";
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export function withBasePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized === "/" ? "" : normalized}`;
}
