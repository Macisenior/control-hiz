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
  const [mostrarPrecio, setMostrarPrecio] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [vista, setVista] = useState("formulario");
  const [precioHora, setPrecioHora] = useState(20);
  const [editando, setEditando] = useState(null);
  const [editFecha, setEditFecha] = useState("");
  const [editLugar, setEditLugar] = useState("");
  const [editHoras, setEditHoras] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState(
  new Date().toISOString().slice(0, 7)  
);

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
const exportarExcel = () => {
  if (registrosFiltrados.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  const wb = XLSX.utils.book_new();

  const precio = precioHora;
  const mesTexto = formatearMes(mesSeleccionado);

  const data = [];

  // ===== CABECERA CORPORATIVA =====
  data.push([`CONTROL HIZ - ${mesTexto}`]);
  data.push([]);
  data.push(["Precio / hora (€)", precio]);
  data.push([]);

  // ===== ENCABEZADOS TABLA =====
  data.push(["Trabajador", "Fecha", "Lugar", "Horas", "Precio", "Total"]);

  // ===== FILAS =====
  registrosFiltrados.forEach((r, index) => {
    const filaExcel = 6 + index; // empieza en fila 6
    data.push([
      r.trabajador,
      r.fecha,
      r.lugar,
      Number(r.horas),
      precio,
      { f: `D${filaExcel}*E${filaExcel}` }
    ]);
  });

  const totalInicio = 6;
  const totalFin = totalInicio + registrosFiltrados.length - 1;

  data.push([]);
  data.push([
    "",
    "",
    "TOTAL HORAS",
    { f: `SUM(D${totalInicio}:D${totalFin})` }
  ]);

  data.push([
    "",
    "",
    "TOTAL €",
    "",
    "",
    { f: `SUM(F${totalInicio}:F${totalFin})` }
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Informe");

  XLSX.writeFile(wb, `Control_HIZ_${mesSeleccionado}.xlsx`);
};
 

  
// Total general
const registrosFiltrados = registros.filter((r) =>
  r.fecha.startsWith(mesSeleccionado)
);
const totalHoras = registrosFiltrados.reduce(
  (acc, r) => acc + Number(r.horas),
  0
  
);
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
// Mes actual
const formatearMes = (mes) => {
  const fecha = new Date(mes + "-01");
  return fecha.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });
};
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

  if (registrosFiltrados.length === 0) {
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

 doc.text(
  `Total horas del mes: ${totalHoras} h`,
  14,
  35
);

doc.text(
  `Total registros: ${totalRegistros}`,
  14,
  42
);
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
  "Generado por Control HIZ",
  105,
  doc.internal.pageSize.height - 10,
  { align: "center" }
);
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
    <div className="gestion-wrapper">

      {/* ===== CONTROL MES ===== */}
      <div className="month-control">
        <button onClick={() => cambiarMes(-1)}>◀</button>
        <h2>{formatearMes(mesSeleccionado)}</h2>
        <button onClick={() => cambiarMes(1)}>▶</button>
      </div>

      {/* ===== TARJETA RESUMEN ===== */}
      <div className="month-summary">
        <div className="month-main">
          <p className="big-hours">{totalHoras} h</p>
          <p className="reg-count">
            {totalRegistros} registros
          </p>
        </div>

        <div className="worker-list">
          {Object.entries(horasPorTrabajadorMes).map(
            ([nombre, horas]) => (
              <div key={nombre} className="worker-row">
                <span>{nombre}</span>
                <strong>{horas} h</strong>
              </div>
            )
          )}
        </div>
      </div>

      {/* ===== BOTONES EXPORTAR ===== */}
      <div className="export-buttons">
        <button
          className="excel-btn"
          onClick={exportarExcel}
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

      {/* ===== REGISTROS ===== */}
      <h2>Registros</h2>

      <div className="registros-container">
        {registrosFiltrados.map((r) => (
          <div key={r.id} className="registro-item">
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

                  await deleteDoc(doc(db, "registros", r.id));
                }}
                className="delete-btn"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  </>
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