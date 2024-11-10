const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
require("./src/libs/hbs-helper");
const config = require("./config/config");
const { QueryTypes, Sequelize } = require("sequelize");
const sequelize = new Sequelize(config.development);
const bcrypt = require('bcrypt');
const session = require("express-session");
const flash = require("express-flash");
const upload = require("./src/middlewares/upload-file");

// require("dotenv").config()
// const environment = process.env.NODE_ENV
// const sequelize = new Sequelize(config[environment]);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./src/views"));

app.use("/assets", express.static(path.join(__dirname, "./src/assets")));
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
      name: "my-session",
      secret: "rahasiabangetdehjangansampaiadayangtahu",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24, // 1 hari
      },
    })
);

// Middleware untuk menampilkan data user di semua view
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.messages = req.flash(); 
    next();
});
  
app.use(flash());

if (environment === "production") {
    sequelize.authenticate()
      .then(() => {
        console.log("Database connected!");
        return sequelize.sync(); 
      })
      .then(() => {
        console.log("Database synchronized!");
      })
      .catch(err => {
        console.error("Unable to connect to the database:", err);
      });
  }
// Rute yang digunakan
app.get("/", home);
app.get("/testimonial", testimonial);
app.get("/contact", contact);
app.get("/project", project);
app.get("/login", login)
app.post("/login", loginPost)
app.post("/logout", logoutPost);
app.get("/register", register)
app.post("/register", registerPost)
app.post("/project",upload.single("image"), projectPost);
app.post("/delete-project/:id", projectDelete);
app.get("/project-detail/:id", projectDetail);
app.get("/update-project/:id", updateProject);
app.post("/update-project/:id",upload.single("image"), updateProjectPost);


// Mengambil data proyek untuk halaman home
async function home(req, res) {
    const user = req.session.user;
    console.log(user);
  

    const query = `SELECT public.tb_projects.*, public.tb_users.name AS author FROM public.tb_projects LEFT JOIN public.tb_users ON public.tb_projects.author_id = public.tb_users.id`;
    let projects = await sequelize.query(query, { type: QueryTypes.SELECT });

    projects = projects.map((project) => ({
        ...project,
        technologies: project.technologies,
    }));



    res.render("index", { projects, user });
}


function testimonial(req, res) {
    res.render("testimonial");
}

function contact(req, res) {
    res.render("contact");
}

function project(req, res) {

    const user = req.session.user;

    if(!user){
        return res.redirect("/login");
    }


    res.render("add-project");
}

function login(req, res) {
    res.render("login");
}

function register(req, res) {
    res.render("register");
}

async function registerPost(req, res) {
    const {name, email, password} = req.body;
    const salt = 10

    const hashedPassword = await bcrypt.hash(password, salt)

    const query = `INSERT INTO public.tb_users(name, email, password) VALUES('${name}','${email}','${hashedPassword}')`

    await sequelize.query(query,{type:QueryTypes.INSERT})

    res.redirect("/login")
}

async function loginPost(req, res) {
    const { email, password } = req.body;
  
    // verifikasi email
    const query = `SELECT * FROM public.tb_users WHERE email='${email}'`;
    const user = await sequelize.query(query, { type: QueryTypes.SELECT });
  
    if (!user.length) {
      req.flash("error", "Email / password salah!");
      return res.redirect("/login");
    }
  
    const isVerifiedPassword = await bcrypt.compare(password, user[0].password);
  
    if (!isVerifiedPassword) {
      req.flash("error", "Email / password salah!");
      return res.redirect("/login");
    }
  
    req.flash("success", "Berhasil login!");
    req.session.user = user[0];
    res.redirect("/");
  }

  function logoutPost(req, res) {
    req.session.destroy((err) => {
      if (err) return console.error("Logout gagal!");
  
      console.log("Logout berhasil!");
  
      res.redirect("/");
    });
  }
  

async function projectPost(req, res) { 
    // Cek apakah user sudah login
    if (!req.session.user) {
        req.flash("error", "Anda harus login terlebih dahulu!");
        return res.redirect("/login");
    }

    const { title, desc, technologies, start_date, end_date } = req.body;
    const techArray = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(',').map(tech => tech.trim())
        : [];
    
    const { id } = req.session.user; 
    const imagePath = req.file.path;
    const formattedTechnologies = `{${techArray.join(',')}}`;

    const query = `
        INSERT INTO public.tb_projects (name, description, image, technologies, start_date, end_date, author_id) 
        VALUES ('${title}', '${desc}', '${imagePath}', '${formattedTechnologies}', '${start_date}', '${end_date}', '${id}')
    `;
    await sequelize.query(query, {
        type: QueryTypes.INSERT
    });
    
    res.redirect("/");
}


async function projectDelete(req, res) {
    const { id } = req.params;
  
    const query = `DELETE FROM public.tb_projects WHERE id=${id}`;
    await sequelize.query(query, { type: QueryTypes.DELETE });
  
    res.redirect("/");
}

async function projectDetail(req, res) {
    const { id } = req.params;

    const query = `SELECT * FROM public.tb_projects WHERE id = :id`;
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
    
    const query = `SELECT * FROM public.tb_projects WHERE id=${id}`;
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
    const { title, desc, technologies, start_date, end_date } = req.body;
    
    // Format technologies ke dalam format array PostgreSQL
    const techArray = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(',').map(tech => tech.trim())
        : [];
    const formattedTechnologies = `{${techArray.join(',')}}`;

  
    const imagePath = req.file ? req.file.path : null;


    const query = `
        UPDATE public.tb_projects
        SET name = '${title}', 
            description = '${desc}', 
            ${imagePath ? `image = '${imagePath}',` : ""}
            technologies = '${formattedTechnologies}', 
            start_date = '${start_date}', 
            end_date = '${end_date}'
        WHERE id = '${id}'
    `;

    await sequelize.query(query, {
        type: QueryTypes.UPDATE
    });
    res.redirect("/");
}


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
