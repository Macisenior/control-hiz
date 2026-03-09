import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function Gestion({
  mesSeleccionado,
  cambiarMes,
  totalHoras,
  totalRegistros,
  horasPorTrabajadorMes,
  exportarExcel,
  exportarPDF,
  exportarBackup,
  restaurarBackup,
  fileInputRef,
  formatearMes,
  registrosFiltrados,
   precioHora,
  setEditando,
  setEditFecha,
  setEditLugar,
  setEditHoras
}) {

return (

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

{Object.entries(horasPorTrabajadorMes).map(([nombre, horas]) => (

<div key={nombre} className="worker-row">
<span>{nombre}</span>
<strong>{horas} h</strong>
</div>

))}

</div>

</div>


{/* ===== BOTONES EXPORTAR ===== */}
<div className="export-buttons">

<button
  className="excel-btn"
  onClick={() => exportarExcel(registrosFiltrados, mesSeleccionado, precioHora)}
>
Exportar Excel
</button>

<button className="pdf-btn" onClick={exportarPDF}>
Exportar PDF
</button>

</div>



{/* ===== BACKUP ===== */}

<div className="backup-buttons">

<button className="backup-btn" onClick={exportarBackup}>
Exportar Backup
</button>

<button
className="backup-btn"
onClick={() => fileInputRef.current.click()}
>
Restaurar Backup
</button>

<input
type="file"
accept=".json"
ref={fileInputRef}
onChange={restaurarBackup}
style={{ display: "none" }}
/>

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
setEditando(r)
setEditFecha(r.fecha)
setEditLugar(r.lugar)
setEditHoras(r.horas)
}}
className="secondary-btn"
>
Editar
</button>


<button
onClick={async () => {

const confirmar = window.confirm(
`¿Seguro que quieres eliminar el registro de ${r.trabajador} del ${r.fecha}?`
)

if (!confirmar) return

await deleteDoc(doc(db, "registros", r.id))

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

)

}

export default Gestion