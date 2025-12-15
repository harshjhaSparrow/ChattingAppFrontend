// src/Utils/commonFunctions.ts

export const capitalizeFirstLetters = (str: string): string =>
  str
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");

export const arrayBufferToBase64 = (
  buffer: any | Uint8Array
): string => {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return `data:image/png;base64,${btoa(binary)}`;
};

export const genClientId = (): string =>
  `cmsg_${crypto.randomUUID()}`;
