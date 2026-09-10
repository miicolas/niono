export class Base64 {
  static encode(value: Uint8Array) {
    let binary = "";
    for (let at = 0; at < value.length; at += 8192)
      binary += String.fromCharCode(...value.subarray(at, at + 8192));
    return btoa(binary);
  }
  static decode(value: string) {
    return Uint8Array.from(atob(value), (letter) => letter.charCodeAt(0));
  }
}
