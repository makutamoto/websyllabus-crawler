"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = __importDefault(require("mysql"));
var Database = /** @class */ (function () {
    function Database(host, user, password, database) {
        this.settings = { host: host, user: user, password: password, database: database, charset: 'utf8mb4' };
    }
    Database.prototype.onError = function (err, resolve, reject) {
        if (err.code == 'PROTOCOL_CONNECTION_LOST') {
            console.log("Database connection has been refused.");
            console.log("Reconecting...");
            this.reconnect(resolve, reject);
        }
        else {
            throw err;
        }
    };
    Database.prototype.reconnect = function (resolve, reject) {
        this.db = mysql_1.default.createConnection(this.settings);
        this.db.connect(function (err) {
            if (err) {
                if (reject)
                    reject(err);
                else
                    throw err;
            }
            else {
                if (resolve)
                    resolve();
            }
        });
        this.db.on('error', this.onError);
    };
    Database.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return _this.reconnect(resolve, reject); });
    };
    Database.prototype.end = function () {
        this.db.end();
    };
    Database.prototype.post = function (course, timestamp) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var info = course.getInformation();
            var plans = course.getPlans();
            var evaluation = course.getEvaluationTable();
            var args = {
                id: course.getId(),
                course_code: info.course_code,
                college: info.college,
                year: info.year,
                course_title: info.course_title,
                course_category: info.course_category,
                class_format: info.class_format,
                credits: info.credits,
                department: info.department,
                student_grade: info.student_grade,
                term: info.term,
                classes_per_week: info.classes_per_week,
                textbook_and_or_teaching_materials: info.textbook_and_or_teaching_materials,
                instructor: info.instructor,
                course_plan_first_term: JSON.stringify(plans[0]),
                course_plan_second_term: JSON.stringify(plans[1]),
                evaluation_weight: JSON.stringify(evaluation),
                original_url: course.link,
                timestamp: timestamp.toJSON(),
            };
            _this.db.query("replace into subject_info set ?", args, function (err) {
                if (err) {
                    _this.onError(err, function () {
                        _this.post(course, timestamp).then(resolve).catch(reject);
                    }, reject);
                }
                resolve();
            });
        });
    };
    Database.prototype.deleteOutdated = function (timestamp) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db.query("DELETE FROM `subject_info` WHERE `timestamp` <> ? OR `timestamp` IS NULL", timestamp.toJSON(), function (err) {
                if (err)
                    reject(err);
                resolve();
            });
        });
    };
    return Database;
}());
exports.default = Database;
