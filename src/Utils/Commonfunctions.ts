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
