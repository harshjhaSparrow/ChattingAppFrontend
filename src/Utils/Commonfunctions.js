"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalizeFirstLetters = capitalizeFirstLetters;
/* eslint-disable @typescript-eslint/no-explicit-any */
function capitalizeFirstLetters(str) {
    // Convert string to array of characters
    var chars = str.split("");
    // Capitalize the first letter of each word
    for (var i = 0; i < chars.length; i++) {
        if (i === 0 || chars[i - 1] === " ") {
            chars[i] = chars[i].toUpperCase();
        }
        else {
            chars[i] = chars[i].toLowerCase();
        }
    }
    // Join the characters back into a string
    return chars.join("");
}
