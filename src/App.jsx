import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
function App() {

  // ===== STATES =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nuevoTrabajador, setNuevoTrabajador] = useState("");
  const [trabajador, setTrabajador] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [horas, setHoras] = useState("");

  const [registros, setRegistros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [vista, setVista] = useState("formulario");

  const [editando, setEditando] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editLugar, setEditLugar] = useState("");
  const [editHoras, setEditHoras] = useState("");
  // ===== EFFECT AUTH =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 
// ===== EFFECT REGISTROS =====
useEffect(() => {
  if (!user) return;

  const unsubscribe = onSnapshot(
    collection(db, "registros"),
    (snapshot) => {
      
    const datos = snapshot.docs
  .map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));  
      setRegistros(datos);
    }
  );

  return () => unsubscribe();
}, [user]);

// ===== EFFECT TRABAJADORES =====
useEffect(() => {
  if (!user) return;

  const unsubscribe = onSnapshot(
    collection(db, "trabajadores"),
    (snapshot) => {
      const datos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrabajadores(datos.map(t => t.nombre));
    }
  );

  return () => unsubscribe();
}, [user]);
 if (loading) {
  return (
    <div className="container">
      <h2>Cargando...</h2>
    </div>
  );
}
const exportarExcel = () => {
  if (registros.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  // -------- HOJA 1: DETALLE --------
  const detalle = registros.map((r) => ({
    Trabajador: r.trabajador,
    Fecha: r.fecha,
    Lugar: r.lugar,
    Horas: Number(r.horas),
  }));

  const hojaDetalle = XLSX.utils.json_to_sheet(detalle);

  // -------- HOJA 2: RESUMEN --------
  const resumen = {};

  registros.forEach((r) => {
    if (!resumen[r.trabajador]) {
      resumen[r.trabajador] = 0;
    }
    resumen[r.trabajador] += Number(r.horas);
  });

  const datosResumen = Object.keys(resumen).map((trabajador) => ({
    Trabajador: trabajador,
    TotalHoras: resumen[trabajador],
  }));

  const hojaResumen = XLSX.utils.json_to_sheet(datosResumen);

  // -------- CREAR LIBRO --------
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hojaDetalle, "Detalle");
  XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");

  XLSX.writeFile(libro, "Control_HIZ.xlsx");
};
// Total general
const totalHoras = registros.reduce(
  (acc, r) => acc + Number(r.horas),
  0
);

// Mes actual
const mesActual = new Date().getMonth();
const añoActual = new Date().getFullYear();

const totalMesActual = registros
  .filter((r) => {
    const fecha = new Date(r.fecha);
    return (
      fecha.getMonth() === mesActual &&
      fecha.getFullYear() === añoActual
    );
  })
  .reduce((acc, r) => acc + Number(r.horas), 0);

// Registros totales
const totalRegistros = registros.length;

// Horas por trabajador
const horasPorTrabajador = {};

registros.forEach((r) => {
  if (!horasPorTrabajador[r.trabajador]) {
    horasPorTrabajador[r.trabajador] = 0;
  }
  horasPorTrabajador[r.trabajador] += Number(r.horas);
});
 if (!user) {
  return (
    <div className="container">
      <h1>Control HIZ</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button
        className="primary-btn"
       onClick={async () => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log("LOGIN OK:", cred.user);
    setUser(cred.user); // 👈 FUERZA EL USER
  } catch (error) {
    console.log(error);
    alert(error.message);
  }
}}
      >
        Entrar
      </button>
    </div>
  );
}
const exportarPDF = () => {

  if (registros.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  const doc = new jsPDF();

  // ===== ENCABEZADO =====
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, 210, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("CONTROL HIZ", 105, 13, { align: "center" });

  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleDateString()}`,
    105,
    18,
    { align: "center" }
  );

  // ===== RESUMEN =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);

  doc.text(`Total horas: ${totalHoras} h`, 14, 35);
  doc.text(`Horas este mes: ${totalMesActual} h`, 14, 42);
  doc.text(`Total registros: ${totalRegistros}`, 14, 49);
  doc.setDrawColor(210);
  doc.line(14, 55, 196, 55);
  // ===== TABLA =====
  const tabla = registros.map((r) => [
    r.trabajador,
    r.fecha,
    r.lugar,
    r.horas + " h",
  ]);

 autoTable(doc, {
  startY: 60,
  head: [["Trabajador", "Fecha", "Lugar", "Horas"]],
  body: tabla,

  styles: {
    fontSize: 10,
    textColor: [60, 60, 60], // gris base
  },

  headStyles: {
    fillColor: [52, 152, 219],
    textColor: 255,
  },

  columnStyles: {
    3: { halign: "right" } // Horas alineadas derecha
  },

  alternateRowStyles: {
    fillColor: [245, 245, 245],
  },

  didParseCell: function (data) {
    if (data.section === "body" && data.column.index === 0) {
      data.cell.styles.textColor = [41, 128, 185]; // azul más visible
      data.cell.styles.fontStyle = "bold";
    }
  }
});

  // ===== TOTAL FINAL =====
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`TOTAL GENERAL: ${totalHoras} h`, 14, finalY);
  doc.text(`TOTAL GENERAL: ${totalHoras} h`, 14, finalY);

// ---- PIE DE PÁGINA ----
doc.setFontSize(8);
doc.setTextColor(150);
doc.setFont(undefined, "normal");
doc.text(
  "Generado por Control HIZ",
  105,
  doc.internal.pageSize.height - 10,
  { align: "center" }
);
  doc.save("Control_HIZ.pdf");
};
 return (
  <div className="container">

    <div className="topbar">
  <div className="brand">
    <span className="brand-text">Control</span>
    <img src={`${import.meta.env.BASE_URL}hiz.png`} alt="HIZ" className="brand-logo" />
  </div>

  <button className="logout-btn" onClick={() => signOut(auth)}>
    Cerrar sesión
  </button>
</div>
    <div className="nav-buttons">
        <button onClick={() => setVista("formulario")}>
          Añadir
        </button>
        <button onClick={() => setVista("gestion")}>
          Gestión
        </button>
        <button onClick={() => setVista("trabajadores")}>
        Trabajadores
      </button>
    </div>

      {vista === "formulario" && (
        <>
          <div style={{ marginBottom: "10px" }}>
          <select
          value={trabajador}
          onChange={(e) => setTrabajador(e.target.value)}
  >
         <option value="">Selecciona trabajador</option>
          {trabajadores.map((t, index) => (
      <option key={index} value={t}>
        {t}
      </option>
    ))}
  </select>
  
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Lugar de trabajo"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="number"
              placeholder="Horas trabajadas"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>

              <button
    className="primary-btn"
    onClick={async () => {
    if (!trabajador || !fecha || !lugar || !horas) {
      alert("Completa todos los campos");
      return;
    }

    const nuevoRegistro = {
      trabajador,
      fecha,
      lugar,
      horas,
    };

    await addDoc(collection(db, "registros"), nuevoRegistro);

    setTrabajador("");
    setFecha("");
    setLugar("");
    setHoras("");
  }}
          >
            Guardar
          </button>
        </>
      )}

      {vista === "gestion" && (      
        <>
        <div className="summary-panel">

    <div className="summary-card">
      <h3>Total horas</h3>
      <p>{totalHoras} h</p>
    </div>

    <div className="summary-card">
      <h3>Horas este mes</h3>
      <p>{totalMesActual} h</p>
    </div>

    <div className="summary-card">
      <h3>Total registros</h3>
      <p>{totalRegistros}</p>
    </div>

  </div>
  <div className="worker-summary">
    <h3>Horas por trabajador</h3>

    {Object.entries(horasPorTrabajador).map(([nombre, horas]) => (
      <div key={nombre} className="worker-row">
        <span>{nombre}</span>
        <strong>{horas} h</strong>
      </div>
    ))}
  </div>
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
    <button
      className="excel-btn"
      onClick={exportarExcel}
      style={{ marginRight: "10px" }}
    >
      Exportar Excel
    </button>

    <button
      className="pdf-btn"
      onClick={exportarPDF}
    >
      Exportar PDF
    </button>
  </div> 
          <h2>Registros</h2>
      <div className="registros-container">    
        {registros.map((r, index) => (
 <div key={index} className="registro-item">
  <div className="registro-texto">
    {r.trabajador} - {r.fecha} - {r.lugar} - {r.horas}h
  </div>

  <div className="registro-actions">
    <button
      onClick={() => {
        setEditando(r);
        setEditFecha(r.fecha);
        setEditLugar(r.lugar);
        setEditHoras(r.horas);
      }}
      className="secondary-btn"
    >
      Editar
    </button>

    <button
      onClick={async () => {
        const confirmar = window.confirm(
          `¿Seguro que quieres eliminar el registro de ${r.trabajador} del ${r.fecha}?`
        );

        if (!confirmar) return;

        try {
          await deleteDoc(doc(db, "registros", r.id));
        } catch (error) {
          alert("Error al eliminar");
          console.log(error);
        }
      }}
      className="delete-btn"
    >
     Eliminar
        </button>
      </div>
    </div>
  ))}
</div>
</>
)}
  {vista === "trabajadores" && (
    <>
      <h2>Trabajadores</h2>

      <input
        type="text"
        placeholder="Nuevo trabajador"
        value={nuevoTrabajador}
        onChange={(e) => setNuevoTrabajador(e.target.value)}
      />

      <button
        className="secondary-btn"
        onClick={async () => {
          if (!nuevoTrabajador) return;

          if (trabajadores.includes(nuevoTrabajador)) {
            alert("Ese trabajador ya existe");
            return;
          }

          await addDoc(collection(db, "trabajadores"), {
            nombre: nuevoTrabajador
          });

          setNuevoTrabajador("");
        }}
      >
        Añadir
      </button>

      <div style={{ marginTop: "20px" }}>
        {trabajadores.map((t, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px"
            }}
          >
            <span>{t}</span>

            <button
              onClick={() => {
                const nuevos = trabajadores.filter((_, i) => i !== index);
                setTrabajadores(nuevos);
              }}
              style={{
                backgroundColor: "#c0392b",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Eliminar
            </button>
          </div>
            ))}
           </div>
    </>
  )}

  {editando && (
    <div className="modal">
      <div className="modal-content">
        <h3>Editar registro</h3>

        <input
          type="date"
          value={editFecha}
          onChange={(e) => setEditFecha(e.target.value)}
        />

        <input
          type="text"
          value={editLugar}
          onChange={(e) => setEditLugar(e.target.value)}
        />

        <input
          type="number"
          value={editHoras}
          onChange={(e) => setEditHoras(e.target.value)}
        />

        <button
          onClick={async () => {
            await updateDoc(doc(db, "registros", editando.id), {
              fecha: editFecha,
              lugar: editLugar,
              horas: editHoras
            });
            setEditando(null);
          }}
        >
          Guardar cambios
        </button>

        <button onClick={() => setEditando(null)}>
          Cancelar
        </button>
      </div>
    </div>
 )}
</div>
);
}


export default App;