import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { useRef } from "react";
 import Gestion from "./components/Gestion"; 
 import { formatearMes } from "./utils/fechas";
import { exportarExcel } from "./utils/exportExcel";  
import { crearRegistro } from "./services/registrosService";
import { escucharRegistros } from "./services/registrosService";
import FormHoras from "./components/FormHoras";

function App() {



  // ===== STATES =====
  
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nuevoTrabajador, setNuevoTrabajador] = useState("");
  const [trabajador, setTrabajador] = useState(
  localStorage.getItem("ultimoTrabajador") || ""
);
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(hoy);
  const [lugar, setLugar] = useState(
  localStorage.getItem("ultimoLugar") || ""
);
  const [horas, setHoras] = useState("");
  const [mostrarPrecio, setMostrarPrecio] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const fileInputRef = useRef(null);
  const [vista, setVista] = useState("formulario");
  const [precioHora, setPrecioHora] = useState(20);
  const [editando, setEditando] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editLugar, setEditLugar] = useState("");
  const [editHoras, setEditHoras] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState(
  new Date().toISOString().slice(0, 7)  
);
const registrosFiltrados = registros.filter((r) =>
  r.fecha.startsWith(mesSeleccionado)
);
const totalHoras = registrosFiltrados.reduce(
  (acc, r) => acc + Number(r.horas),
  0
);
const ultimo = registros
  .filter(r => r.trabajador === trabajador)
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
const exportarBackup = () => {

  const backup = {
    fecha: new Date().toISOString(),
    registros: registros,
    trabajadores: trabajadores
  };

  const datos = JSON.stringify(backup, null, 2);

  const blob = new Blob([datos], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const ahora = new Date();
const fecha = ahora.toISOString().slice(0,10);
const hora = ahora.toTimeString().slice(0,5).replace(":", "-");

a.download = `backup_control_hiz_${fecha}_${hora}.json`;

  a.click();

  URL.revokeObjectURL(url);
};
 // ===== EFFECT AUTH =====
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
      setUser(usuario);
    }
  });

  return () => unsubscribe();
}, []);


// ===== EFFECT REGISTROS =====
useEffect(() => {

  if (!user) return;

  const unsubscribe = escucharRegistros((datos) => {
    setRegistros(datos);
    setLoading(false);
  });

  return () => unsubscribe();

}, [user]);
 const restaurarBackup = async (event) => {

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {

    try {

      const datos = JSON.parse(e.target.result);

      for (const registro of datos) {
        await addDoc(collection(db, "registros"), registro);
      }

      alert("Backup restaurado correctamente");

    } catch (error) {
      console.error(error);
      alert("Error al restaurar backup");
    }

  };

  reader.readAsText(file);
};
// ===== EFFECT REGISTROS =====
const ultimoRegistro = () => {

  const ultimo = registros
    .filter(r => r.trabajador === trabajador)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

  if (!ultimo) {
    alert("No hay registros anteriores para este trabajador");
    return;
  }

  setLugar(ultimo.lugar);
  setHoras(ultimo.horas);
};
const guardarHorasRapido = async (h) => {

  const hoy = new Date().toISOString().slice(0,10);

  const nuevoRegistro = {
    trabajador,
    fecha: hoy,
    lugar,
    horas: h
  };

 await crearRegistro(nuevoRegistro);

  setFecha(hoy);
  setHoras(h);

};
useEffect(() => {
  const ultimoTrabajador = localStorage.getItem("ultimoTrabajador");
  const ultimoLugar = localStorage.getItem("ultimoLugar");

  if (ultimoTrabajador) setTrabajador(ultimoTrabajador);
  if (ultimoLugar) setLugar(ultimoLugar);
  if (!fecha) {
  setFecha(new Date().toISOString().slice(0,10));
}
}, []);
useEffect(() => {
  if (registros.length === 0) return;

  const meses = [
    ...new Set(registros.map(r => r.fecha.slice(0, 7)))
  ].sort().reverse();

  const mesActual = new Date().toISOString().slice(0, 7);

  if (meses.includes(mesActual)) {
    setMesSeleccionado(mesActual);
  } else {
    setMesSeleccionado(meses[0]);
  }

}, [registros]);
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
const cambiarMes = (direccion) => {
  const fecha = new Date(mesSeleccionado + "-01");
  fecha.setMonth(fecha.getMonth() + direccion);

  const nuevoMes = fecha.toISOString().slice(0, 7);
  setMesSeleccionado(nuevoMes);
};
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

 const añoActual = new Date().getFullYear(); 
// =============================
// HORAS POR TRABAJADOR (MES)
// =============================

const horasPorTrabajadorMes = {};

registrosFiltrados.forEach((r) => {
  if (!horasPorTrabajadorMes[r.trabajador]) {
    horasPorTrabajadorMes[r.trabajador] = 0;
  }
  horasPorTrabajadorMes[r.trabajador] += Number(r.horas);
});
// =============================
// HORAS POR TRABAJADOR (AÑO)
// =============================

const horasPorTrabajadorAnual = {};

registros.forEach((r) => {
  const fecha = new Date(r.fecha);

  if (fecha.getFullYear() === añoActual) {
    if (!horasPorTrabajadorAnual[r.trabajador]) {
      horasPorTrabajadorAnual[r.trabajador] = 0;
    }

    horasPorTrabajadorAnual[r.trabajador] += Number(r.horas);
  }
});

const mesActual = new Date().getMonth();


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
const totalRegistros = registrosFiltrados.length;

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
  type="password"
  placeholder="Contraseña"
   autoFocus
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

<br /><br />

<button
  className="primary-btn"
  onClick={async () => {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        "hiz@izquierdo-zalaya.com",
        password
      );
      console.log("LOGIN OK:", cred.user);
      setUser(cred.user);
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

  if (registrosFiltrados.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

const doc = new jsPDF();

// ===== ENCABEZADO =====
const logoHIZ = "data:image/png;base64,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"
doc.setFillColor(44, 62, 80);
doc.rect(0, 0, 210, 20, "F");

// logo
doc.addImage(logoHIZ, "PNG", 15, 4, 18, 12);
// texto
doc.setTextColor(255, 255, 255);
doc.setFontSize(18);
doc.text(`CONTROL HIZ - ${formatearMes(mesSeleccionado)}`, 40, 13);

doc.setFontSize(10);
doc.text(`Generado: ${new Date().toLocaleDateString()}`, 150, 13);

// ===== CONTENIDO =====
doc.setTextColor(0, 0, 0);

  // ===== RESUMEN =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);


doc.text(`Periodo: ${formatearMes(mesSeleccionado)}`, 14, 35);
doc.text(
  `Total horas del mes: ${totalHoras} h`,
  14,
  45
);

doc.text(
  `Total registros: ${totalRegistros}`,
  14,
  52
);
doc.setDrawColor(200);
doc.line(14, 58, 196, 58);

  // ===== TABLA =====
  const tabla = registrosFiltrados.map((r) => [
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
  fillColor: [44, 62, 80],
  textColor: 255,
  halign: "center"
},

columnStyles: {
  0: { cellWidth: 35 },   // trabajador
  1: { halign: "center" },
  2: { cellWidth: 90 },   // lugar
  3: { halign: "right", cellWidth: 25 }
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
const finalY = doc.lastAutoTable.finalY + 15;
const totalImporte = totalHoras * precioHora;

// Fondo suave
doc.setFillColor(245, 247, 250);
doc.rect(12, finalY - 8, 186, 30, "F");

// Texto
doc.setFontSize(12);
doc.setFont(undefined, "normal");
doc.setTextColor(60);

doc.text(`Total horas`, 20, finalY);
doc.text(`${totalHoras} h`, 150, finalY, { align: "right" });

doc.text(`Precio / hora`, 20, finalY + 8);
doc.text(`${precioHora} €`, 150, finalY + 8, { align: "right" });
doc.setDrawColor(200);
doc.line(14, finalY - 12, 196, finalY - 12);
// Total final destacado
doc.setFont(undefined, "bold");
doc.setFontSize(14);
doc.setTextColor(30, 70, 140);

doc.text(`TOTAL FINAL`, 20, finalY + 18);
doc.text(`${totalImporte} €`, 150, finalY + 18, { align: "right" });

// ---- PIE DE PÁGINA ----
doc.setFontSize(8);
doc.setTextColor(150);
doc.setFont(undefined, "normal");
doc.text(
  "InformeGenerado por Control HIZ",
  105,
  doc.internal.pageSize.height - 10,
  { align: "center" }
);
const paginas = doc.internal.getNumberOfPages();

for (let i = 1; i <= paginas; i++) {
  doc.setPage(i);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Página ${i} de ${paginas}`,
    200,
    doc.internal.pageSize.height - 10,
    { align: "right" }
  );
}
 doc.save(`Control_HIZ_${mesSeleccionado}.pdf`);
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
<div className="config-wrapper">
  <button
    className="config-btn"
    onClick={() => setMostrarPrecio(!mostrarPrecio)}
  >
    ⚙
  </button>
</div>


{mostrarPrecio && (
  <div className="precio-box">
    <label>Precio / hora (€)</label>
    <input
      type="number"
      value={precioHora}
      onChange={(e) => setPrecioHora(Number(e.target.value))}
    />
  </div>
)}
   <div className="nav-buttons">
  <button
    className={vista === "formulario" ? "nav-btn active" : "nav-btn"}
    onClick={() => setVista("formulario")}
  >
    Añadir
  </button>

  <button
    className={vista === "gestion" ? "nav-btn active" : "nav-btn"}
    onClick={() => setVista("gestion")}
  >
    Gestión
  </button>

  <button
    className={vista === "trabajadores" ? "nav-btn active" : "nav-btn"}
    onClick={() => setVista("trabajadores")}
  >
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

       await crearRegistro(nuevoRegistro);

        localStorage.setItem("ultimoTrabajador", trabajador);
        localStorage.setItem("ultimoLugar", lugar);

        setFecha("");
        setHoras("");
      }}
    >
      Guardar
    </button>
<button
  className="secondary-btn"
  onClick={ultimoRegistro}
>
  {ultimo
    ? `Repetir: ${ultimo.lugar} (${ultimo.horas}h)`
    : "Repetir último"}
</button>
    {/* BOTONES RÁPIDOS */}
    <div className="quick-hours">

      <button
        className="quick-btn btn8"
        onClick={() => guardarHorasRapido(8)}
      >
        +8h
      </button>

      <button
        className="quick-btn btn7"
        onClick={() => guardarHorasRapido(7)}
      >
        +7h
      </button>

      <button
        className="quick-btn btn6"
        onClick={() => guardarHorasRapido(6)}
      >
        +6h
      </button>

    </div>

  </>
)}  



{vista === "gestion" && (
<Gestion
  mesSeleccionado={mesSeleccionado}
  cambiarMes={cambiarMes}
  totalHoras={totalHoras}
  totalRegistros={totalRegistros}
  horasPorTrabajadorMes={horasPorTrabajadorMes}
  exportarExcel={exportarExcel}
  exportarPDF={exportarPDF}
  exportarBackup={exportarBackup}
  restaurarBackup={restaurarBackup}
  fileInputRef={fileInputRef}
  formatearMes={formatearMes}
  registrosFiltrados={registrosFiltrados}
  precioHora={precioHora}
  setEditando={setEditando}
  setEditFecha={setEditFecha}
  setEditLugar={setEditLugar}
  setEditHoras={setEditHoras}
/>
)}

 {vista === "trabajadores" && (
  <>
  <div className="trabajadores-header">
  <h2>Trabajadores</h2>

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
</div>

<input
  type="text"
  placeholder="Nuevo trabajador"
  value={nuevoTrabajador}
  onChange={(e) => setNuevoTrabajador(e.target.value)}
/>

    {/* ===== TARJETAS ===== */}
   <div className="trabajadores-grid">
  {trabajadores.map((t, index) => (
    <div key={index} className="trabajador-card">

      <div className="trabajador-header">
        <span className="trabajador-nombre">{t}</span>
        <div className="trabajador-datos">
         <span className="trabajador-horas">
  {horasPorTrabajadorAnual[t] || 0} h
</span>
<span className="trabajador-sub">
  Año actual
</span>

          <button
            className="delete-btn small"
            onClick={() => {
              const nuevos = trabajadores.filter((_, i) => i !== index);
              setTrabajadores(nuevos);
            }}
          >
            Eliminar
          </button>
        </div>
      </div>

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