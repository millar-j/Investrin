const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "investrin-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

const USERS_FILE = path.join(__dirname, "users.json");

// Helper: read users file (returns array)
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// Helper: save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Registration route
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send("Email and password required");

  const users = getUsers();
  if (users.find((u) => u.email === email))
    return res.status(400).send("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, password: hashedPassword });
  saveUsers(users);
  res.status(201).send("Registration successful");
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send("Email and password required");

  const users = getUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).send("Invalid email or password");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(401).send("Invalid email or password");

  req.session.user = email;
  res.send("Login successful");
});

// Dashboard (protected)
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized. Please log in.");
  }
  res.send(`<h1>Welcome to your dashboard, ${req.session.user}!</h1>
            <p><a href="/logout">Logout</a></p>`);
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
