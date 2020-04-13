"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var KosenWebSyllabus_1 = require("./KosenWebSyllabus");
var Database_1 = __importDefault(require("./Database"));
var axios_1 = __importDefault(require("axios"));
function sleep(mseconds) {
    return new Promise(function (resolve) { return setTimeout(resolve, mseconds); });
}
function postSlack(text) {
    if (process.env.WSC_SLACK_HOOK) {
        axios_1.default.post(process.env.WSC_SLACK_HOOK, "payload={\"text\": \"" + text + "\"}");
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var db, timestamp, home, collegeIndex, college, departmentIndex, department, departmentMessage, courseIndex, course;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.WSC_DB_HOST === undefined)
                        throw new Error("WSC_DB_HOST not set.");
                    if (process.env.WSC_DB_USER === undefined)
                        throw new Error("WSC_DB_USER not set.");
                    if (process.env.WSC_DB_PASSWORD === undefined)
                        throw new Error("WSC_DB_PASSWORD not set.");
                    if (process.env.WSC_DB_DATABASE === undefined)
                        throw new Error("WSC_DB_DATABASE not set.");
                    db = new Database_1.default(process.env.WSC_DB_HOST, process.env.WSC_DB_USER, process.env.WSC_DB_PASSWORD, process.env.WSC_DB_DATABASE);
                    timestamp = new Date();
                    postSlack("Crawling syllabus has started.");
                    return [4 /*yield*/, db.connect()];
                case 1:
                    _a.sent();
                    home = new KosenWebSyllabus_1.Home();
                    return [4 /*yield*/, home.load()];
                case 2:
                    _a.sent();
                    collegeIndex = 0;
                    _a.label = 3;
                case 3:
                    if (!(collegeIndex < home.links.length)) return [3 /*break*/, 16];
                    college = home.links[collegeIndex];
                    return [4 /*yield*/, college.load()];
                case 4:
                    _a.sent();
                    departmentIndex = 0;
                    _a.label = 5;
                case 5:
                    if (!(departmentIndex < college.links.length)) return [3 /*break*/, 13];
                    department = college.links[departmentIndex];
                    departmentMessage = void 0;
                    return [4 /*yield*/, department.load()];
                case 6:
                    _a.sent();
                    departmentMessage = "Fetching " + college.name + "(" + (departmentIndex + 1) + "/" + college.links.length + ")...";
                    postSlack(departmentMessage);
                    console.log(departmentMessage);
                    courseIndex = 0;
                    _a.label = 7;
                case 7:
                    if (!(courseIndex < department.links.length)) return [3 /*break*/, 10];
                    course = department.links[courseIndex];
                    console.log("Crawling " + (courseIndex + 1) + "/" + department.links.length + " " + course.link);
                    // await course.load();
                    // await db.post(course, timestamp);
                    return [4 /*yield*/, sleep(10000)];
                case 8:
                    // await course.load();
                    // await db.post(course, timestamp);
                    _a.sent();
                    _a.label = 9;
                case 9:
                    courseIndex++;
                    return [3 /*break*/, 7];
                case 10: return [4 /*yield*/, sleep(10000)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    departmentIndex++;
                    return [3 /*break*/, 5];
                case 13: return [4 /*yield*/, sleep(10000)];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15:
                    collegeIndex++;
                    return [3 /*break*/, 3];
                case 16:
                    console.log("Deleting outdated information...");
                    return [4 /*yield*/, db.deleteOutdated(timestamp)];
                case 17:
                    _a.sent();
                    postSlack("Clawing syllabus has finished.");
                    console.log("Done.");
                    db.end();
                    return [2 /*return*/];
            }
        });
    });
}
main();
