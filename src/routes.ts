export const SPECIAL_1111_PATH = "/special/1111";
export function isSpecial1111Path(pathname: string) {
  return pathname === SPECIAL_1111_PATH || pathname === SPECIAL_1111_PATH + "/";
}
