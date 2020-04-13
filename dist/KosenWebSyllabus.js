"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsdom_1 = require("jsdom");
var axios_1 = __importDefault(require("axios"));
var LinkFetcher = /** @class */ (function () {
    function LinkFetcher(type) {
        this.type = type;
        this.linkHead = 'https://syllabus.kosen-k.go.jp';
    }
    LinkFetcher.prototype.loadLinks = function (link, selector) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            axios_1.default.get(link).then(function (response) {
                var dom = new jsdom_1.JSDOM(response.data);
                _this.links = Array.from(dom.window.document.querySelectorAll(selector)).map(function (e) {
                    var a = e;
                    return new _this.type(a.textContent.trim(), _this.linkHead + a.href.trim());
                });
                resolve();
            })
                .catch(function (err) { return reject(err); });
        });
    };
    return LinkFetcher;
}());
function zip(keys, values) {
    var information = {};
    values.forEach(function (value, i) { return information[keys[i]] = value; });
    return information;
}
function zenkakuToHankaku(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}
var creditRegex = /履修単位:\s*(\d+)/;
var Course = /** @class */ (function () {
    function Course(name, link) {
        this.name = name;
        this.link = link;
    }
    Course.prototype.load = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            axios_1.default.get(_this.link).then(function (response) {
                _this.document = new jsdom_1.JSDOM(response.data).window.document;
                resolve();
            })
                .catch(function (err) { return reject(err); });
        });
    };
    Course.prototype.getId = function () {
        if (this.id === undefined) {
            var info = this.getInformation();
            this.id = info.college + '_' + info.department + '_' + info.course_code + '_' + info.year;
        }
        return this.id;
    };
    Course.prototype.getName = function () {
        return this.document.querySelector('.mcc-title-bar h1').textContent.trim();
    };
    Course.prototype.getPurpose = function () {
        return this.document.querySelector('#MainContent_SubjectSyllabus_syllabusContent > div:first-of-type').textContent.trim();
    };
    Course.prototype.getInformation = function () {
        var keys = ["college", "year", "course_title", "course_code", "course_category", "class_format", "credits", "department", "student_grade", "term", "classes_per_week", "textbook_and_or_teaching_materials", "instructor"];
        var values = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_UpdatePanelSyllabus > div > table:first-of-type tr > td')).map(function (a) { return a.textContent.trim(); });
        var info = zip(keys, values);
        var credits = creditRegex.exec(info.credits);
        info.credits = credits === null ? info.credits : credits[1];
        return info;
    };
    Course.prototype.getRubrick = function () {
        var rubrick = [];
        var temp = { ideal: "", standard: "", unacceptable: "" };
        var values = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_hyouka tr:not(.bg-success) td')).map(function (a) { return a.textContent.trim().split('\n').join(''); });
        for (var i = 0; i < values.length; i++) {
            var index = i % 3;
            var value = values[i];
            switch (index) {
                case 0:
                    temp.ideal = value;
                    break;
                case 1:
                    temp.standard = value;
                    break;
                case 2:
                    temp.unacceptable = value;
                    break;
            }
            if (index == 2)
                rubrick.push({ ideal: temp.ideal, standard: temp.standard, unacceptable: temp.unacceptable });
        }
        return rubrick;
    };
    Course.prototype.getMethod = function () {
        var keys = ["outline", "style", "notice"];
        var values = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_syllabusContent > div:nth-of-type(4) > div')).map(function (a) { return a.textContent.trim(); });
        return zip(keys, values);
    };
    Course.prototype.getEvaluationTable = function () {
        var header = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_wariaiTable tr:nth-child(1) th')).map(function (a) { return a.textContent.trim(); }).slice(0, -1);
        var points = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_wariaiTable td')).map(function (a) { return a.textContent.trim(); }).slice(1);
        var rowTitle = Array.from(this.document.querySelectorAll('#MainContent_SubjectSyllabus_wariaiTable tr:not(.bg-success) > th')).map(function (a) { return a.textContent.trim(); });
        var phase = header.length + 1;
        var table = {};
        var temp = [];
        var currentRow = 0;
        for (var i = 0; i < points.length; i++) {
            var index = i % phase;
            if (index == header.length) {
                table[rowTitle[currentRow]] = JSON.parse(JSON.stringify(temp));
                currentRow += 1;
                temp = [];
            }
            else {
                temp.push({ label: header[index], data: Number(zenkakuToHankaku(points[i])) });
            }
        }
        return table;
    };
    Course.prototype.getPlans = function () {
        var table = this.document.querySelector('#lessonsTable tbody');
        var list = Array.from(table.querySelectorAll('td')).map(function (a) { return a.textContent.trim(); });
        var kokiSeparator = table.querySelector('th[class="bg-danger"]');
        var zenkiWeeks = kokiSeparator === null ? list.length : 2 * (Array.from(table.children).indexOf(kokiSeparator.parentElement) - 2);
        var temp = { theme: "", goals: "" };
        var plans = [[], []];
        for (var i = 0; i < list.length; i++) {
            if (i % 2 == 0) {
                temp.theme = list[i];
            }
            else {
                temp.goals = list[i];
                plans[i >= zenkiWeeks ? 1 : 0].push({ theme: temp.theme, goals: temp.goals });
            }
        }
        return plans;
    };
    Course.prototype.show = function () {
        console.log(this.getName());
        console.log(this.getPurpose());
        console.log(this.getInformation());
        console.log(this.getRubrick());
        console.log(this.getMethod());
        console.log(this.getEvaluationTable());
        console.log(this.getPlans());
    };
    return Course;
}());
exports.Course = Course;
var Department = /** @class */ (function (_super) {
    __extends(Department, _super);
    function Department(name, link) {
        var _this = _super.call(this, Course) || this;
        _this.name = name;
        _this.link = link;
        return _this;
    }
    Department.prototype.load = function () {
        return _super.prototype.loadLinks.call(this, this.link, '#sytablenc:nth-of-type(1) a[class="mcc-show"]');
    };
    return Department;
}(LinkFetcher));
exports.Department = Department;
var Kosen = /** @class */ (function (_super) {
    __extends(Kosen, _super);
    function Kosen(name, link) {
        var _this = _super.call(this, Department) || this;
        _this.name = name;
        _this.link = link;
        return _this;
    }
    Kosen.prototype.load = function () {
        return _super.prototype.loadLinks.call(this, this.link, 'div.panel-body a:nth-of-type(1)');
    };
    return Kosen;
}(LinkFetcher));
exports.Kosen = Kosen;
var Home = /** @class */ (function (_super) {
    __extends(Home, _super);
    function Home() {
        var _this = _super.call(this, Kosen) || this;
        _this.link = 'https://syllabus.kosen-k.go.jp/Pages/PublicSchools?lang=ja';
        return _this;
    }
    Home.prototype.load = function () {
        return _super.prototype.loadLinks.call(this, this.link, 'table.school_table div[style=""] > a');
    };
    return Home;
}(LinkFetcher));
exports.Home = Home;
