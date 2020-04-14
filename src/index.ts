import { Home } from './KosenWebSyllabus';
import Database from './Database';

import axios from 'axios';

function sleep(mseconds: number) {
    return new Promise((resolve: () => void) => setTimeout(resolve, mseconds));
}

function postSlack(text: string) {
    if(process.env.WSC_SLACK_HOOK) {
        axios.post(process.env.WSC_SLACK_HOOK, `payload={"text": "${text}"}`);
    }
}

async function main() {
    if(process.env.WSC_DB_HOST === undefined) throw new Error("WSC_DB_HOST not set.");
    if(process.env.WSC_DB_USER === undefined) throw new Error("WSC_DB_USER not set.");
    if(process.env.WSC_DB_PASSWORD === undefined) throw new Error("WSC_DB_PASSWORD not set.");
    if(process.env.WSC_DB_DATABASE === undefined) throw new Error("WSC_DB_DATABASE not set.");

    let db = new Database(process.env.WSC_DB_HOST, process.env.WSC_DB_USER, process.env.WSC_DB_PASSWORD, process.env.WSC_DB_DATABASE);
    let timestamp = new Date();
    postSlack("Crawling syllabus has started.");
    await db.connect();
    let home = new Home();
    await home.load();
    for(let collegeIndex = 0;collegeIndex < home.links!.length;collegeIndex++) {
        let college = home.links![collegeIndex];
        await college.load();
        for(let departmentIndex = 0;departmentIndex < college.links!.length;departmentIndex++) {
            let department = college.links![departmentIndex];
            let departmentMessage;
            await department.load();
            departmentMessage = `Fetching ${college.name}(${departmentIndex + 1}/${college.links!.length})...`;
            postSlack(departmentMessage);
            console.log(departmentMessage);
            for(let courseIndex = 0;courseIndex < department.links!.length;courseIndex++) {
                let course = department.links![courseIndex];
                console.log(`Crawling ${courseIndex + 1}/${department.links!.length} ${course.link}`);
                await course.load();
                await db.post(course, timestamp);
                await sleep(10000);
            }
            await sleep(10000);
        }
        await sleep(10000);
    }
    console.log("Deleting outdated information...");
    await db.deleteOutdated(timestamp);
    postSlack("Clawing syllabus has finished.");
    console.log("Done.")
    db.end();
}

main();
