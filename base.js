class ISO8583Parser {
    constructor(rawMessage) {
        this._descriptions = {
            "versionList": {
                "0": "ISO 8583:1987",
                "1": "ISO 8583:1993",
                "2": "ISO 8583:2003",
                "3": "Reserved by ISO",
                "4": "Reserved by ISO",
                "5": "Reserved by ISO",
                "6": "Reserved by ISO",
                "7": "Reserved by ISO",
                "8": "National use",
                "9": "Private use"
            },
            "classList": {
                "0": "Reserved by ISO",
                "1": "Authorization message",
                "2": "Financial messages",
                "3": "File actions message",
                "4": "Reversal and chargeback messages",
                "5": "Reconciliation message",
                "6": "Administrative message",
                "7": "Fee collection messages",
                "8": "Network management message",
                "9": "Reserved by ISO"
            },
            "functionList": {
                "0": "Request",
                "1": "Request response",
                "2": "Advice",
                "3": "Advice response",
                "4": "Notification",
                "5": "Notification acknowledgement",
                "6": "Instruction",
                "7": "Instruction acknowledgement",
                "8": "Reserved for ISO use",
                "9": "Reserved for ISO use"
            },
            "originList": {
                "0": "Acquirer",
                "1": "Acquirer repeat",
                "2": "Issuer",
                "3": "Issuer repeat",
                "4": "Other"
            }
        };
        this._rawMessage = String(rawMessage).trim();
        this.message = {};
    }

    #checkLength() {
        if (this._rawMessage) {
            this.message["raw"] = this._rawMessage;
        } else {
            throw ("ISO message cannot be empty.");
        }
    }

    #checkMTI() {
        this.message["MTI"] = this._rawMessage.substring(0, 4);
        if (this.message["MTI"].length !== 4) {
            throw("MTI value not valid.");
        }
    }

    #checkVersion() {
        let versionIndex = this.message["MTI"].charAt(0);
        if (this._descriptions["versionList"].hasOwnProperty(versionIndex)) {
            this.message["version"] = this._descriptions["versionList"][versionIndex];
        } else {
            throw("Message version not valid.");
        }
    }

    #checkClass() {
        let classIndex = this.message["MTI"].charAt(1);
        if (this._descriptions["classList"].hasOwnProperty(classIndex)) {
            this.message["class"] = this._descriptions["classList"][classIndex];
        } else {
            throw("Message class not valid.");
        }
    }

    #checkFunction() {
        let functionIndex = this.message["MTI"].charAt(2);
        if (this._descriptions["functionList"].hasOwnProperty(functionIndex)) {
            this.message["function"] = this._descriptions["functionList"][functionIndex];
        } else {
            throw("Message function not valid.");
        }
    }

    #checkOrigin() {
        let originIndex = this.message["MTI"].charAt(3);
        if (this._descriptions["originList"].hasOwnProperty(originIndex)) {
            this.message["origin"] = this._descriptions["originList"][originIndex];
        } else {
            throw("Message origin not valid.");
        }
    }

    #checkBitmaps() {
        let bitmaps = [];
        let mostSignBit;
        do {
            let _bIndex = (bitmaps.length * 16) + 4;
            let _bitmapHex = this._rawMessage.substring(_bIndex, (_bIndex + 16));
            if (_bitmapHex.length !== 16) throw("Bitmap(s) not valid: too short.");
            let _bitmapBin = Array.from(_bitmapHex).map(h => parseInt(h, 16).toString(2).padStart(4, "0")).join("");
            if (_bitmapBin.includes("NaN")) throw("Bitmap(s) not valid: non hex.");
            let _bitmapFields = [];
            Array.from(_bitmapBin).forEach(function (b, i) {
                if ((b === "1") && (i > 0)) {
                    _bitmapFields.push((bitmaps.length * 64) + i + 1);
                }
            });
            bitmaps.push({
                "hexadecimal": _bitmapHex,
                "binary": _bitmapBin,
                "fields": _bitmapFields
            });
            mostSignBit = _bitmapBin.charAt(0);
        }
        while (mostSignBit === "1");
        this.message["bitmaps"] = bitmaps;
    }

    parse() {
        try {
            this.#checkLength();
            this.#checkMTI();
            this.#checkVersion();
            this.#checkClass();
            this.#checkFunction();
            this.#checkOrigin();
            this.#checkBitmaps();
        } catch (e) {
            this.message = {"err": String(e)};
        }
    }
}


//let myParser = new ISO8583Parser("0400F23A400108418202000000400000000019111111111000000000018000000000003000001090806461003310011200909080996010060002000000000003430003948 03808110012000004096565733200000003000001360030003317000394809080646");
let myParser = new ISO8583Parser("0800823A000020000000840000000000000004200906139000010906130420042003ÉÉÉ001");
myParser.parse();

console.log(myParser.message);