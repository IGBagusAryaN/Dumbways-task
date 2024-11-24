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

app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.messages = req.flash(); 
    console.log("Messages Middleware:", res.locals.messages); // Debugging
    next();
});

// Rute yang digunakan
app.get("/", home);
app.get("/testimonial", testimonial);
app.get("/contact", contact);
app.get("/project", project);
app.get("/login", login);
app.post("/login", loginPost);
app.post("/logout", logoutPost);
app.get("/register", register);
app.post("/register", registerPost);
app.post("/project", upload.single("image"), projectPost);
app.post("/delete-project/:id", projectDelete);
app.get("/project-detail/:id", projectDetail);
app.get("/update-project/:id", updateProject);
app.post("/update-project/:id", upload.single("image"), updateProjectPost);

// Mengambil data proyek untuk halaman home
async function home(req, res) {
    const user = req.session.user;
    const query = `SELECT tb_projects.*, tb_users.name AS author FROM tb_projects LEFT JOIN tb_users ON tb_projects.author_id = tb_users.id`;
    let projects = await sequelize.query(query, { type: QueryTypes.SELECT });

    projects = projects.map((project) => ({
        ...project,
        technologies: project.technologies,
    }));

    res.render("index", { projects, user, messages: res.locals.messages });
}

function testimonial(req, res) {
    res.render("testimonial");
}

function contact(req, res) {
    res.render("contact");
}

function project(req, res) {
    const user = req.session.user;

    if (!user) {
        return res.redirect("/login");
    }

    res.render("add-project", { messages: res.locals.messages });
}

function login(req, res) {
    res.render("login", { messages: res.locals.messages });
}

function register(req, res) {
    res.render("register", { messages: res.locals.messages });
}

async function registerPost(req, res) {
    const { name, email, password } = req.body;
    const salt = 10;

    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `INSERT INTO tb_users(name, email, password) VALUES('${name}', '${email}', '${hashedPassword}')`;
    await sequelize.query(query, { type: QueryTypes.INSERT });

    req.flash("success", "Registrasi berhasil. Silakan login.");
    res.redirect("/login");
}

async function loginPost(req, res) {
    const { email, password } = req.body;

    const query = `SELECT * FROM tb_users WHERE email='${email}'`;
    const user = await sequelize.query(query, { type: QueryTypes.SELECT });

    if (!user.length) {
        req.flash("error", "Email atau password salah!");
        return res.redirect("/login");
    }

    const isVerifiedPassword = await bcrypt.compare(password, user[0].password);

    if (!isVerifiedPassword) {
        req.flash("error", "Email atau password salah!");
        return res.redirect("/login");
    }

    req.flash("success", "Berhasil login!");
    console.log("Success Flash:", req.flash("success")); // Debug: Pastikan pesan sukses ada
    req.session.user = user[0];
    res.redirect("/");
    
}

function logoutPost(req, res) {
    req.session.destroy((err) => {
        if (err) return console.error("Logout gagal!");
        res.redirect("/");
    });
}

async function projectPost(req, res) {
    if (!req.session.user) {
        req.flash("error", "Anda harus login terlebih dahulu!");
        return res.redirect("/login");
    }

    const { title, desc, technologies, start_date, end_date } = req.body;
    const techArray = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(",").map((tech) => tech.trim())
        : [];

    const { id } = req.session.user;
    const errors = [];

    // Validasi Field Kosong
    if (!title) errors.push("Please enter a project name.");
    if (!start_date) errors.push("Please enter the start date.");
    if (!end_date) errors.push("Please enter the end date.");
    if (!desc) errors.push("Please enter a project description.");
    if (techArray.length === 0) errors.push("Please select at least one technology.");
    if (!req.file) errors.push("Please upload a project image.");

    // Jika ada error, kirim error dan data lama ke form
    if (errors.length > 0) {
        req.flash("erroraddproject", errors); // Kirimkan array errors ke flash
        req.flash("oldData", { title, desc, technologies: techArray, start_date, end_date }); // Kirimkan data yang sudah diisi
        return res.redirect("/project");
    }

    try {
        const imagePath = req.file.path;
        const formattedTechnologies = `{${techArray.join(",")}}`;

        // Gunakan parameterized query untuk keamanan
        const query = `
            INSERT INTO tb_projects (name, description, image, technologies, start_date, end_date, author_id) 
            VALUES (:title, :desc, :imagePath, :technologies, :start_date, :end_date, :author_id)
        `;

        await sequelize.query(query, {
            replacements: {
                title,
                desc,
                imagePath,
                technologies: formattedTechnologies,
                start_date,
                end_date,
                author_id: id,
            },
            type: QueryTypes.INSERT,
        });

        req.flash("success", "Project added successfully!");
        return res.redirect("/");
    } catch (error) {
        console.error("Database Error:", error);
        req.flash("error", "An unexpected error occurred. Please try again.");
        return res.redirect("/project");
    }
}



async function projectDelete(req, res) {
    const { id } = req.params;
  
    const query = `DELETE FROM tb_projects WHERE id=${id}`;
    await sequelize.query(query, { type: QueryTypes.DELETE });
  
    req.flash("success", "Proyek berhasil dihapus.");
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

    // Ambil data project berdasarkan id
    const projectQuery = `SELECT * FROM tb_heros WHERE id=${id}`;
    const project = await sequelize.query(projectQuery, { type: QueryTypes.SELECT });

    // Ambil semua data types untuk ditampilkan di dropdown
    const typesQuery = `SELECT * FROM tb_types`;
    const types = await sequelize.query(typesQuery, { type: QueryTypes.SELECT });

    if (project.length > 0) {
        res.render("edit-char", { project: project[0], types });
    } else {
        res.redirect("/");
    }
}

async function updateProjectPost(req, res) {
    const { id } = req.params;
    const { title, desc, technologies, start_date, end_date } = req.body;
    
    const techArray = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(',').map(tech => tech.trim())
        : [];
    const formattedTechnologies = `{${techArray.join(',')}}`;

    const imagePath = req.file ? req.file.path : null;

    const query = `
        UPDATE tb_projects
        SET name = '${title}', 
            description = '${desc}', 
            ${imagePath ? `image = '${imagePath}',` : ""}
            technologies = '${formattedTechnologies}', 
            start_date = '${start_date}', 
            end_date = '${end_date}' WHERE id = '${id}'
    `;

    await sequelize.query(query, {
        type: QueryTypes.UPDATE
    });
    req.flash("success", "Proyek berhasil diperbarui.");
    res.redirect("/");
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
