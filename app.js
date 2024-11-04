const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
require("./libs/hbs-helper");
const config = require("./config/config.json");
const { QueryTypes, Sequelize } = require("sequelize");
const sequelize = new Sequelize(config.development);

app.set("view engine", "hbs");

app.use("/assets", express.static(path.join(__dirname, "./assets")));
app.use(express.urlencoded({ extended: true }));
// Rute yang digunakan
app.get("/", home);
app.get("/testimonial", testimonial);
app.get("/contact", contact);
app.get("/project", project);
app.post("/project", projectPost);
app.post("/delete-project/:id", projectDelete);
app.get("/project-detail/:id", projectDetail);
app.get("/update-project/:id", updateProject);
app.post("/update-project/:id", updateProjectPost);


// Mengambil data proyek untuk halaman home
async function home(req, res) {
    const query = `SELECT * FROM tb_projects`;
    let projects = await sequelize.query(query, { type: QueryTypes.SELECT });

    projects = projects.map((project) => ({
        ...project,
        technologies: project.technologies,
        timePost: project.timePost,
    }));

    res.render("index", { projects });
}


const projects = [];

function testimonial(req, res) {
    res.render("testimonial");
}

function contact(req, res) {
    res.render("contact");
}

function project(req, res) {
    res.render("add-project");
}

async function projectPost(req, res) { 
    const { title, desc, technologies, start_date, end_date } = req.body;
    
    const techArray = Array.isArray(technologies)
    ? technologies
    : typeof technologies === "string"
    ? technologies.split(',').map(tech => tech.trim())
    : [];

    const formattedTechnologies = `{${techArray.join(',')}}`;

    const query = `
        INSERT INTO tb_projects (name, description, image, technologies, start_date, end_date) 
        VALUES ('${title}', '${desc}', 'https://i.namu.wiki/i/QPnRfQqdbrtD7DyUd5FFhdQs43lrN55S58tiNP9ghjuj5KwEEKAamZk20ch3uyWMK3wQg8M4KtvyfDMh80kdHg.webp', '${formattedTechnologies}', '${start_date}', '${end_date}')
    `;
        await sequelize.query(query, {
            type: QueryTypes.INSERT
        });
        
        res.redirect("/");
}


async function projectDelete(req, res) {
    const { id } = req.params;
  
    const query = `DELETE FROM tb_projects WHERE id=${id}`;
    await sequelize.query(query, { type: QueryTypes.DELETE });
  
    res.redirect("/");
}

async function projectDetail(req, res) {
    const { id } = req.params;

    const query = `SELECT * FROM tb_projects WHERE id = :id`;
    const project = await sequelize.query(query, { 
        type: QueryTypes.SELECT, 
        replacements: { id } 
    });

    if (project.length > 0) {
        project[0].author = "Bagus Arya";
        res.render("project-detail", { project: project[0] });
    } else {
        res.redirect("/");
    }
}

async function updateProject(req, res) {
    const { id } = req.params;

    const query = `SELECT * FROM tb_projects WHERE id=${id}`;
    const project = await sequelize.query(query, { type: QueryTypes.SELECT });

    if (project.length > 0) {
        project[0].author = "Bagus Arya";
        res.render("update-project", { project: project[0] });
    } else {
        res.redirect("/");
    }
}
async function updateProjectPost(req, res) {
    const { id } = req.params;
    const { title, desc, start_date, end_date, technologies } = req.body;

    const query = `
        UPDATE tb_projects 
        SET name = $title, 
            description = $desc, 
            start_date = $start_date, 
            end_date = $end_date, 
            technologies = $technologies
        WHERE id = $id
    `;
        await sequelize.query(query, {
            type: QueryTypes.UPDATE,
            bind: { title, desc, start_date, end_date, technologies, id }
        });

        res.redirect("/");
}





app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
