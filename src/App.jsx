export default function App() {
  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header">
        <div>
          <div className="title">AXIS</div>
          <div className="subtitle">Hola, Usuario 🚀</div>
        </div>
      </div>

      {/* CARD NIVEL */}
      <div className="card">
        <div>Nivel 3</div>
        <div className="progress-bar">
          <div className="progress"></div>
        </div>
        <div style={{ marginTop: 8, opacity: 0.6 }}>
          1,750 XP / 2,500 XP
        </div>
      </div>

      {/* TAREAS */}
      <div className="section">
        <div className="section-title">Mis tareas</div>

        <div className="task">
          <div className="task-left">
            <div className="circle"></div>
            <div>
              <div className="task-text">Preparar presentación</div>
              <div className="task-sub">Hoy 2:00 PM</div>
            </div>
          </div>
        </div>

        <div className="task">
          <div className="task-left">
            <div className="circle"></div>
            <div>
              <div className="task-text">Responder correos</div>
              <div className="task-sub">Hoy</div>
            </div>
          </div>
        </div>

        <div className="task completed">
          <div className="task-left">
            <div className="circle"></div>
            <div>
              <div className="task-text">Hacer ejercicio</div>
              <div className="task-sub">Mañana</div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTÓN */}
      <div className="fab">+</div>

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
