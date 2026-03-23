import { useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    { text: "Preparar presentación", done: false },
    { text: "Responder correos", done: false },
  ]);

  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask) return;
    setTasks([...tasks, { text: newTask, done: false }]);
    setNewTask("");
  };

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header">
        <div>
          <div className="title">AXIS</div>
          <div className="subtitle">Hola 🚀</div>
        </div>
      </div>

      {/* INPUT NUEVA TAREA */}
      <div className="card">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Nueva tarea..."
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            marginBottom: "10px"
          }}
        />
        <button
          onClick={addTask}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background: "#f4c542",
            fontWeight: "bold"
          }}
        >
          Agregar tarea
        </button>
      </div>

      {/* LISTA */}
      <div className="section">
        <div className="section-title">Mis tareas</div>

        {tasks.map((task, index) => (
          <div
            key={index}
            className={`task ${task.done ? "completed" : ""}`}
            onClick={() => toggleTask(index)}
          >
            <div className="task-left">
              <div className="circle"></div>
              <div className="task-text">{task.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN */}
      <div className="fab" onClick={addTask}>+</div>

      {/* NAVBAR */}
      <div className="navbar">
        <div className="nav-item active">Inicio</div>
        <div className="nav-item">Stats</div>
        <div className="nav-item">+</div>
        <div className="nav-item">Premios</div>
        <div className="nav-item">Perfil</div>
      </div>

    </div>
  );
}
