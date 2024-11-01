const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
require("./libs/hbs-helper");
const config = require("./config/config.json")
const { QueryTypes, Sequelize} = require("sequelize");
const sequelize = new Sequelize(config.development);

app.set("view engine", "hbs")

app.use("/assets", express.static(path.join(__dirname, "./assets")))
app.use("/assets/js", express.static("assets/js"))
app.use("/assets/png", express.static("assets/png"))
app.use("/assets/svg", express.static("assets/svg"))
app.use("/views", express.static("views"))

app.use(express.urlencoded({ extended: true }));

app.get("/", home);
app.get("/testimonial", testimonial);
app.get("/contact", contact);
app.get("/project", project);
app.post("/project", projectPost);
app.post("/delete-project/:index", projectDelete);
app.get("/project-detail/:index", projectDetail);
app.get("/update-project/:index", updateProject);
app.post("/update-project/:index", updateProjectPost);



const projects = [];

function home (req, res){
    res.render("index", {projects})
};

async function project(req, res) {
  const query = `SELECT * FROM tb_projects`;
  let projects = await sequelize.query(query, { type: QueryTypes.SELECT});

  projects = projects.map((project)=> ({
    ...project,
  }));

  res.render("index", {projects});
}

function project (req, res){
    res.render("add-project")
};

function testimonial (req, res){
    res.render("testimonial")
};
function contact (req, res){
    res.render("contact")
};

async function projectDetail(req, res) {
    const { id } = req.params;

    const query = `SELECT * FROM projects WHERE id = ${id}`
    const project = await sequelize.query(query, { type: QueryTypes.SELECT });

    project[0].author = "Bagus Arya";
    res.render("project-detail", { project: project[0] });
  }
  
async function projectPost(req, res) {
    const { title, desc } = req.body;

    const query = `INSERT INTO tb_projects(name,description,image) VALUES('${title}','${desc}', 'https://cdn.idntimes.com/content-images/duniaku/post/20240102/53e15-16596004347246-31d0481229478e18754dbe4327003280.jpeg')`

    await sequelize.query(query, { type:QueryTypes.INSERT })

    res.redirect("/");
    // projects.unshift({
    //     title,
    //     desc,
    //     createdAt: new Date(),
    //     image:
    //       "/assets/png/game-web.png",
    //   });
    
      

    console.log("Title : ", title);
    console.log("Description : ", desc);
  
    // res.json(req.body);
}


async function projectDelete(req, res) {
    const { id } = req.params;
  
    const query = `DELETE FROM projects WHERE id=${id}`
    await sequelize.query(query, { type: QueryTypes.DELETE})  
    // projects.splice(index, 1);
  
    res.redirect("/");
  }
  
async function updateProject(req, res) {
    const { id } = req.params;
  
    const query = `SELECT * FROM projects WHERE id=$(id)`
    const project = await sequelize.query(query, { type: QueryTypes.SELECT});
    project[0].author = "Bagus Arya"
    
    // const project = projects.find((_, idx) => idx == index);
  
    res.render("update-project", { project: project[0] });
  }

async function updateProjectPost(req, res) {
    const { index } = req.params;
  
    const { title, desc } = req.body;

    const query = `UPDATE projects SET title='${title}', description='${desc} WHERE id${id}`;
    await sequelize.query(query, {type: QueryTypes.UPDATE})
  
    // projects[index] = {
    //   title,
    //     desc,
    //     createdAt: new Date(),
    //     image:
    //       "/assets/png/game-web.png",
    //   };
  
    res.redirect("/")
  }
// app.get("/", (req, res) => {
//     const nilai = req.query.nilai
//     res.send(nilai);
// });

app.get("/about", (req, res) => {
    res.send("Ini adalah halaman about");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});