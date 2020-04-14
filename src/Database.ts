import mysql from 'mysql';

import { Course } from './KosenWebSyllabus';

interface Settings {
    host: string,
    user: string,
    password: string,
    database: string,
    charset: string,
}
interface RecordRow {
    id: string,
    course_code: string,
    college: string,
    year: string,
    course_title: string,
    course_category: string,
    class_format: string,
    credits: string,
    department: string,
    student_grade: string,
    term: string,
    classes_per_week: string,
    textbook_and_or_teaching_materials: string,
    instructor: string,
    course_plan_first_term: string,
    course_plan_second_term: string,
    evaluation_weight: string,
    original_url: string,
    timestamp: string,
}
export default class Database {
    private db?: mysql.Connection;
    private settings: Settings;
    constructor(host: string, user: string, password: string, database: string) {
        this.settings = { host, user, password, database, charset: 'utf8mb4' };
    }
    private onError(err: any, resolve?: () => void, reject?: (err: any) => void) {
        if(err.code == 'PROTOCOL_CONNECTION_LOST') {
            console.log("Database connection has been refused.");
            console.log("Reconecting...");
            this.reconnect(resolve, reject);
        } else {
            throw err;
        }
    }
    private reconnect(resolve?: () => void, reject?: (err: any) => void): void {
        this.db = mysql.createConnection(this.settings);
        this.db.connect((err) => {
            if(err) {
                if(reject) reject!(err);
                else throw err;
            } else {
                if(resolve) resolve!();
            }
        });
        this.db.on('error', this.onError.bind(this));
    }
    public connect(): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => this.reconnect(resolve, reject));
    }
    public end(): void {
        this.db!.end();
    }
    public post(course: Course, timestamp: Date): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => {
            let info = course.getInformation();
            let plans = course.getPlans();
            let evaluation = course.getEvaluationTable();
            let args: RecordRow = {
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
            this.db!.query("replace into subject_info set ?", args, (err) => {
                if(err) {
                    this.onError(err, () => {
                        this.post(course, timestamp).then(resolve).catch(reject);
                    }, reject);
                }
                resolve();              
            });
        });
    }
    public deleteOutdated(timestamp: Date): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => {
            this.db!.query("DELETE FROM `subject_info` WHERE `timestamp` <> ? OR `timestamp` IS NULL", timestamp.toJSON(), (err) => {
                if(err) reject(err);
                resolve();
            });
        });
    }
}
