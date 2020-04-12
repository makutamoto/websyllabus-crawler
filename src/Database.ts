import mysql from 'mysql';

import { Course } from './KosenWebSyllabus';

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
}
export default class Database {
    private db: mysql.Connection;
    constructor(host: string, user: string, password: string, database: string) {
        this.db = mysql.createConnection({ host, user, password, database });
    }
    public connect(): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => {
            this.db.connect((err) => {
                if(err) reject(err);
                else resolve();
            })
        });
    }
    public end(): void {
        this.db.end();
    }
    public post(course: Course): Promise<void> {
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
            };
            this.db.query("replace into subject_info set ?", args, (err) => {
              if(err) reject(err);
              resolve();              
            });
        });
    }
}
