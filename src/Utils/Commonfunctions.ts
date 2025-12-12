/* eslint-disable @typescript-eslint/no-explicit-any */
export function capitalizeFirstLetters(str: string) {
  // Convert string to array of characters
  const chars: any = str.split("");

  // Capitalize the first letter of each word
  for (let i = 0; i < chars.length; i++) {
    if (i === 0 || chars[i - 1] === " ") {
      chars[i] = chars[i].toUpperCase();
    } else {
      chars[i] = chars[i].toLowerCase();
    }
  }

  // Join the characters back into a string
  return chars.join("");
}


export function arrayBufferToBase64(arrayBuffer: any) {
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64String = btoa(binaryString);
  return `data:image/png;base64,${base64String}`;
}

export function genClientId() {
  return `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

