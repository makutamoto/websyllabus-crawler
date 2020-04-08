import { JSDOM } from 'jsdom';
import axios from 'axios';

interface Link {
    readonly name: string,
    readonly link: string,
}

abstract class LinkFetcher<T extends Link> {
    linkHead = 'https://syllabus.kosen-k.go.jp' as const;
    links?: T[];
    constructor(private type: new(name: string, link: string) => T) {}
    public loadLinks(link: string, selector: string): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => {
            axios.get(link).then(response => {
                let dom = new JSDOM(response.data);
                this.links = Array.from(dom.window.document.querySelectorAll(selector)).map(e => {
                    let a = e as HTMLLinkElement;
                    return new this.type(a.textContent!.trim(), this.linkHead + a.href.trim());
                });
                resolve();
            })
            .catch(err => reject(err));
        });
    }
}

interface Dictionary {
    [index: string]: string,
}
function zip(keys: string[], values: string[]): Dictionary {
    let information: Dictionary = {};
    values.forEach((value, i) => information[keys[i]] = value);
    return information;
}

function zenkakuToHankaku(str: string): string {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

interface RubrickRow {
    ideal: string,
    standard: string,
    unacceptable: string,
}
interface PlanRow {
    theme: string,
    goals: string,
}
interface EvaluationCell {
    label: string,
    data: number,
}
export class Course implements Link {
    document?: Document;
    constructor(public name: string, public link: string) {}
    public load(): Promise<void> {
        return new Promise((resolve: () => void, reject: (err: any) => void) => {
            axios.get(this.link).then(response => {
                this.document = new JSDOM(response.data).window.document;
                resolve();
            })
            .catch(err => reject(err));
        });
    }
    public getName(): string {
        return this.document!.querySelector('.mcc-title-bar h1')!.textContent!.trim();
    }
    public getPurpose(): string {
        return this.document!.querySelector('#MainContent_SubjectSyllabus_syllabusContent > div:first-of-type')!.textContent!.trim();
    }
    public getInformation(): Dictionary {
        let keys = ["college", "year", "course_title", "course_code", "course_category", "class_format", "credits", "department", "student_grade", "term", "classes_per_week", "textbook_and/or_teaching_materials", "instructor"];
        let values = Array.from(this.document!.querySelectorAll('#MainContent_SubjectSyllabus_UpdatePanelSyllabus > div > table:first-of-type tr > td')).map(a => a.textContent!.trim());
        return zip(keys, values);
    }
    public getRubrick(): RubrickRow[] {
        let rubrick: RubrickRow[] = [];
        let temp: RubrickRow = { ideal: "", standard: "", unacceptable: "" };
        let values = Array.from(this.document!.querySelectorAll('#MainContent_SubjectSyllabus_hyouka tr:not(.bg-success) td')).map(a => a.textContent!.trim().split('\n').join(''));
        for(let i = 0;i < values.length;i++) {
            let index = i % 3;
            let value = values[i];
            switch(index) {
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
            if(index == 2) rubrick.push({ ideal: temp.ideal, standard: temp.standard, unacceptable: temp.unacceptable });
        }
        return rubrick;
    }
    public getMethod(): Dictionary {
        let keys = ["outline", "style", "notice"];
        let values = Array.from(this.document!.querySelectorAll('#MainContent_SubjectSyllabus_syllabusContent > div:nth-of-type(4) > div')).map(a => a.textContent!.trim());
        return zip(keys, values);
    }
    public getEvaluationTable(): EvaluationCell[][] {
        let header = Array.from(this.document!.querySelectorAll('#MainContent_SubjectSyllabus_wariaiTable tr:nth-child(1) th')).map(a => a.textContent!.trim()).slice(0, -1);
        let points = Array.from(this.document!.querySelectorAll('#MainContent_SubjectSyllabus_wariaiTable td')).map((a) => a.textContent!.trim()).slice(1);
        let phase = header.length + 1;
        let table: EvaluationCell[][] = [];
        let temp: EvaluationCell[] = [];
        for(let i = 0;i < points.length;i++) {
            let index = i % phase;
            if(index == header.length) {
                table.push(JSON.parse(JSON.stringify(temp)));
                temp = [];
            } else {
                temp.push({ label: header[index], data: Number(zenkakuToHankaku(points[i])) });
            }
        }
        return table;
    }
    public getPlans() {
        let table = this.document!.querySelector('#lessonsTable tbody')!;
        let list = Array.from(table.querySelectorAll('td')).map((a) => a.textContent!.trim());
        let zenkiWeeks = 2 * (Array.from(table.children).indexOf(table.querySelector('th[class="bg-danger"]')!.parentElement!) - 2);
        let temp: PlanRow = { theme: "", goals: "" };
        let plans: [PlanRow[], PlanRow[]] = [[], []];
        for(let i = 0;i < list.length;i++) {
            if(i % 2 == 0) {
                temp.theme = list[i];
            } else {
                temp.goals = list[i];
                plans[i >= zenkiWeeks ? 1 : 0].push({ theme: temp.theme, goals: temp.goals });
            }
        }
        return plans;
    }
    public show(): void {
        console.log(this.getName());
        console.log(this.getPurpose());
        console.log(this.getInformation());
        console.log(this.getRubrick());
        console.log(this.getMethod());
        console.log(this.getEvaluationTable());
        console.log(this.getPlans());
    }
}

export class Department extends LinkFetcher<Course> implements Link {
    constructor(public name: string, public link: string) {
        super(Course);
    }
    public load(): Promise<void> {
        return super.loadLinks(this.link, '#sytablenc:nth-of-type(1) a[class="mcc-show"]');
    }
}

export class Kosen extends LinkFetcher<Department> implements Link {
    constructor(public name: string, public link: string) {
        super(Department);
    }
    public load(): Promise<void> {
        return super.loadLinks(this.link, 'div.panel-body a:nth-of-type(1)');
    }
}

export class Home extends LinkFetcher<Kosen> {
    link = 'https://syllabus.kosen-k.go.jp/Pages/PublicSchools?lang=ja';
    constructor() {
        super(Kosen);
    }
    public load(): Promise<void> {
        return super.loadLinks(this.link, 'table.school_table div[style=""] > a');
    }
}
