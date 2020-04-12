import { Home } from './KosenWebSyllabus';
import Database from './Database';

function sleep(mseconds: number) {
    return new Promise((resolve: () => void) => setTimeout(resolve, mseconds));
}

async function main() {
    if(process.env.WSC_DB_HOST === undefined) throw new Error("WSC_DB_HOST not set.");
    if(process.env.WSC_DB_USER === undefined) throw new Error("WSC_DB_USER not set.");
    if(process.env.WSC_DB_PASSWORD === undefined) throw new Error("WSC_DB_PASSWORD not set.");
    if(process.env.WSC_DB_DATABASE === undefined) throw new Error("WSC_DB_DATABASE not set.");

    let db = new Database(process.env.WSC_DB_HOST, process.env.WSC_DB_USER, process.env.WSC_DB_PASSWORD, process.env.WSC_DB_DATABASE);
    await db.connect();
    let home = new Home();
    await home.load();
    let college = home.links![0];
    await college.load();
    let department = college.links![0];
    await department.load();
    for(let i = 0;i < department.links!.length;i++) {
        let course = department.links![i];
        console.log(`Crawing ${i + 1}/${department.links!.length} ${course.link}`);
        await course.load();
        await db.post(course);
        await sleep(3000);
    }
    db.end();
}

main();
