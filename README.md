<div align="center">

# 🚀 TaskFlow

### A Full-Stack Task Management Application

Organize, track, and manage your daily tasks with a fast, responsive, and modern task management system built using Node.js, Express.js, MongoDB, and JavaScript.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 About The Project

TaskFlow is a full-stack task management application designed to help users efficiently organize their daily activities. The application provides a clean user interface for managing tasks while utilizing a powerful backend API and MongoDB database for persistent data storage.

This project was developed to strengthen full-stack development skills, including frontend development, backend API creation, database integration, and deployment workflows.

---

## ✨ Features

- ✅ Create new tasks
- ✏️ Edit existing tasks
- 🗑️ Delete tasks
- ☑️ Mark tasks as completed
- 📱 Fully responsive design
- 🔄 Real-time task updates
- 🌐 RESTful API architecture
- 🗄️ MongoDB database integration

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="25%">

**Frontend**
- HTML5
- CSS3
- JavaScript (ES6)

</td>
<td valign="top" width="25%">

**Backend**
- Node.js
- Express.js

</td>
<td valign="top" width="25%">

**Database**
- MongoDB
- Mongoose

</td>
<td valign="top" width="25%">

**Tools**
- Git & GitHub
- Postman
- VS Code

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```text
Frontend (HTML/CSS/JS)
          │
          ▼
REST API Requests
          │
          ▼
Backend (Node.js + Express)
          │
          ▼
MongoDB Database
```

---

## 📂 Project Structure

```text
TaskFlow/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## ⚙️ Installation

**1. Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/TaskFlow.git
cd TaskFlow
```

**2. Install Dependencies**
```bash
cd backend
npm install
```

**3. Configure Environment Variables**

Create a `.env` file inside the `backend` folder:
```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
```

**4. Run Backend**
```bash
npm start
```
or, for development with auto-reload:
```bash
npm run dev
```

**5. Run Frontend**

Open `frontend/index.html` directly, or serve it with:
```bash
npx live-server
```

---

## 🔌 API Endpoints

| Method   | Endpoint         | Description       |
|----------|-------------------|--------------------|
| `GET`    | `/api/tasks`      | Get all tasks      |
| `POST`   | `/api/tasks`      | Create a task      |
| `PUT`    | `/api/tasks/:id`  | Update a task      |
| `DELETE` | `/api/tasks/:id`  | Delete a task      |

---

## 📸 Screenshots

### Dashboard
![TaskFlow Dashboard](screenshots/dashboard.png)

### Frontend Code (index.html)
![Frontend Code](screenshots/frontend-code.png)

### Backend Code (server.js)
![Backend Code](screenshots/backend-code.png)

---

## 🌐 Deployment

| Layer    | Suggested Platforms       |
|----------|-----------------------------|
| Frontend | Vercel, Netlify             |
| Backend  | Render, Railway              |
| Database | MongoDB Atlas                |

---

## 🎯 Future Improvements

- [ ] User Authentication
- [ ] Task Categories
- [ ] Priority Levels
- [ ] Due Dates
- [ ] Search & Filtering
- [ ] Dark Mode
- [ ] Notifications
- [ ] Mobile Application

---

## 👨‍💻 Developer

**Ashutosh Gautam**
B.Tech CSE Student
Backend Developer | Java Enthusiast | Tech Explorer

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/YOUR_USERNAME)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/YOUR_PROFILE)

---

## ⭐ Support

If you like this project, consider giving it a star on GitHub.
It helps the project reach more developers and motivates future improvements.

---

## 📜 License

This project is licensed under the **MIT License**.

<div align="center">

© 2026 Ashutosh Gautam

</div>
