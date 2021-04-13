import { v4 as uuidv4 } from "uuid";

// prettier-ignore
const chars = [
    'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5',
    '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z'
];

/**
 * 将 32 位的 UUID 转化成 8 位的短码
 *
 * @export
 * @returns {string}
 */
export function uuid(): string {
    const uuidStr = uuidv4().replace(/-/g, '')
    const buf = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      const str: string = uuidStr.substring(i * 4, i * 4 + 4)
      const n: number = Number.parseInt(str, 16)
      buf.write(chars[n % 0x3e], i)
    }
    return buf.toString()
  }
  