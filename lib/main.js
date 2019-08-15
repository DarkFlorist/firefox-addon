"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
function generateJWT(key, secret) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
        iss: key,
        jti: Math.random().toString(),
        iat: issuedAt,
        exp: issuedAt + 60
    };
    return jsonwebtoken_1.default.sign(payload, secret, {
        algorithm: 'HS256'
    });
}
function sendRequest(path, manifest, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // read version from manifest
        const manifestJson = JSON.parse(fs_1.default.readFileSync(manifest, 'utf8'));
        const version = manifestJson.version;
        // request headers
        const headers = new Headers();
        headers.append('Authorization', `JWT ${token}`);
        headers.append('Content-Type', 'multipart/form-data');
        // addon and version
        const addonBuffer = fs_1.default.readFileSync(path);
        const body = new FormData();
        body.append('upload', new Blob([addonBuffer]));
        body.append('version', version);
        // Send request
        const request = new Request('https://addons.mozilla.org/api/v4/addons/', {
            method: 'PUT',
            headers,
            body
        });
        const response = yield fetch(request);
        const json = yield response.json();
        if (response.status != 201 && response.status != 202) {
            throw new Error(`${response.statusText}: ${json.error}`);
        }
        return json;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const path = core.getInput('xpi', { required: true });
            const manifest = core.getInput('manifest', { required: true });
            const key = core.getInput('api-key', { required: true });
            const secret = core.getInput('api-secret', { required: true });
            const token = generateJWT(key, secret);
            const response = yield sendRequest(path, manifest, token);
            core.debug(`Published version ${response.version}`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();