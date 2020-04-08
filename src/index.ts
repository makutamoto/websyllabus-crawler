import { Home } from './KosenWebSyllabus';

let home = new Home();
home.load().then(() => {
    home.links![47].load().then(() => {
        home.links![47].links![0].load().then(() => {
            home.links![47].links![0].links![0].load().then(() => {
                home.links![47].links![0].links![0].show();
            });
        })
    });
});