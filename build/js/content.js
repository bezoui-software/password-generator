(function() {
    function getCurrentHostname() {
        return window.location.host;
    }

    function saveToStorage(data) {
        chrome.storage.sync.set(data, function() {
            console.log(data);
        });
    }

    function savePassword(password) {
        let hostname = getCurrentHostname();
        password = password;
        saveToStorage({[hostname]: password});
    }

    function getPasswordInputs() {
        let inputs = Array.from(document.getElementsByTagName("input"));
        inputs = inputs.filter(input => input.type == "password");
        return inputs;
    }

    function getPasswordInputsState() {
        let inputs = getPasswordInputs();
        if (inputs.length > 0) {
            return true;
        }
        return false;
    }

    function getSecurePassword() {
        const passswordLength = 20;
        const chars = {
            alphas: "azertyuiopqsdfghjklmwxcvbn",
            digits: "0123456789",
            specialChars: " !#'$%&’()*+,-./:;<=>?@[\]^_`{|}~"
        }

        let password = "";
        for (let i=0; i<passswordLength; i++) {
            let charsList = random(chars);
            let char = random(charsList);
            password += char
        }

        return password;
    }

    function usePassword({password}) {
        let inputs = getPasswordInputs();
        for (input of inputs) {
            input.style.background = "rgba(0, 0, 0, 0.1)";
            input.value = password;
        }
        savePassword(password);
    }

    async function getSavedPassword(hostname) {
        return toPromise((resolve, reject) => {
            chrome.storage.sync.get([hostname], (result) => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);

                result = result[hostname];
                resolve(result);
            });
        });
    }

    async function getSavedPasswordForCurrentHostname() {
        let hostname = getCurrentHostname();
        let password = await getSavedPassword(hostname);
        return password;
    }

    async function isHostnameSaved() {
        let hostname = getCurrentHostname();
        res = await getSavedPasswordForCurrentHostname();
        if (res) {
            return true;
        }
    }

    function sendMessage(msg) {
        chrome.runtime.sendMessage(msg);
    }

    async function onMessage(msg, sender, sendResponse) {
        const cmds = {
            "get-password-input-state": getPasswordInputsState,
            "get-password": getSecurePassword,
            "use-password": usePassword, 
            "is-hostname-saved": isHostnameSaved,
            "get-saved-password-for-current-hostname": getSavedPasswordForCurrentHostname,
            "get-current-hostname": getCurrentHostname
        }

        let res = "cmd-error";
        let req = msg.cmd;
        let params = msg?.params;
        let func = cmds[req];

        if (func) {
            res =  await func(params);
        }

        sendResponse({res, req});
        return true;
    }

    function run() {
        chrome.runtime.onMessage.addListener((a, b, c)=> {
            onMessage(a, b, c);
            return true;
        });
    }

    run();

    function encodePassword(password) {
        return btoa(unescape(encodeURIComponent(password)));
    }

    function decodePassword(password) {
        return decodeURIComponent(escape(atob(password)));
    }

    function random(a, b) {
        if (isDigit(a)) {
            return randomFloat(a, b);
        } else if (isArray(a)) {
            return randomArrayElement(a);
        } else if (isDict(a)) { 
            return randomDictElement(a);
        } else if (isString(a)) {
            return randomStringChar(a);
        }
    }

    function randomFloat(min=0, max=0) {
        return Math.random() * (max - min + 1) + min;
    }
    
    function randomInt(min=0, max=0) {
        return Math.floor(randomFloat(min, max));
    }

    function randomArrayElement(arr) {
        const max = arr.length - 1;
        const elementIndex = randomInt(0, max);
        return arr[elementIndex];
    }

    function randomDictElement(dict) {
        const keys = Object.keys(dict);
        const key = randomArrayElement(keys);
        return dict[key];
    }

    function randomStringChar(str) {
        const charsList = Array.from(str);
        const char = randomArrayElement(charsList);
        return char;
    }

    function isDigit(a) {
        return typeof a == 'number';
    }

    function isArray(a) {
        return a instanceof Array;
    }

    function isDict(a) {
        return typeof a==='object' && a!==null && !isArray(a) && !isDate(a);
    }

    function isString(a) {
        return typeof a == "string";
    }

    function isDate(a) {
        return a instanceof Date;
    }

    const toPromise = (callback) => {
        const promise = new Promise((resolve, reject) => {
            try {
                callback(resolve, reject);
            }
            catch (err) {
                reject(err);
            }
        });
        return promise;
    }
}())
