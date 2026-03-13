import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { exportTrabajoPDF } from "../utils/exportTrabajoPDF";
function Trabajos({ user }) {


  
const [mostrarFormulario, setMostrarFormulario] = useState(false);

const [nombreTrabajo, setNombreTrabajo] = useState("");
const [cliente, setCliente] = useState("");
const [lugar, setLugar] = useState("");

const [trabajos, setTrabajos] = useState([]);
const [trabajoActivo, setTrabajoActivo] = useState(null);

const [trabajadores, setTrabajadores] = useState([]);
const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState("");

const [registros, setRegistros] = useState([]);
const [horasSeleccionadas, setHorasSeleccionadas] = useState(8);

const [vistaTrabajo, setVistaTrabajo] = useState("horas");

const [materiales, setMateriales] = useState([]);
const totalMateriales = materiales.reduce(
(acc,m)=> acc + ((m.cantidad || 0) * (m.precio || 0)),
0
)
const [materialNombre, setMaterialNombre] = useState("");
const [materialCantidad, setMaterialCantidad] = useState("");
const [materialesCatalogo, setMaterialesCatalogo] = useState([]);
const [materialSeleccionado, setMaterialSeleccionado] = useState("");
const [unidadMaterial, setUnidadMaterial] = useState("");
const [materialPrecio, setMaterialPrecio] = useState("")
const [fechaRegistro, setFechaRegistro] = useState(
new Date().toISOString().slice(0,10)
);
const [precioHora, setPrecioHora] = useState("");
/* =========================
   CARGAR TRABAJOS
========================= */

useEffect(() => {

if (!user) return;

const unsubscribe = onSnapshot(
collection(db,"trabajos"),
(snapshot)=>{

const lista = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

lista.sort((a,b)=> b.fecha.localeCompare(a.fecha));

setRegistros(lista);

setTrabajos(lista);
});

return ()=>unsubscribe();

},[user]);


/* =========================
   CARGAR TRABAJADORES
========================= */

useEffect(()=>{

const cargarTrabajadores = async()=>{

const snapshot = await getDocs(collection(db,"trabajadores"));

const lista = snapshot.docs.map(doc=>({
id: doc.id,
...doc.data()
}));

setTrabajadores(lista);
};

cargarTrabajadores();

},[]);


/* =========================
   REGISTROS HORAS
========================= */

useEffect(()=>{

if(!trabajoActivo) return;

const unsubscribe = onSnapshot(
collection(db,"trabajos",trabajoActivo.id,"registros"),
(snapshot)=>{

const lista = snapshot.docs.map(doc=>({
id: doc.id,
...doc.data()
}));

setRegistros(lista);
});

return ()=>unsubscribe();

},[trabajoActivo]);


/* =========================
   MATERIALES
========================= */

useEffect(()=>{

if(!trabajoActivo) return;

const unsubscribe = onSnapshot(
collection(db,"trabajos",trabajoActivo.id,"materiales"),
(snapshot)=>{

const lista = snapshot.docs.map(doc=>({
id: doc.id,
...doc.data()
}));

setMateriales(lista);
});

return ()=>unsubscribe();

},[trabajoActivo]);


/* =========================
   CREAR TRABAJO
========================= */

const crearTrabajo = async()=>{

if(!nombreTrabajo || !cliente || !lugar){
alert("Completa todos los campos");
return;
}

await addDoc(collection(db,"trabajos"),{
nombre:nombreTrabajo,
cliente:cliente,
lugar:lugar,
estado:"activo",
creado:new Date()
});

setNombreTrabajo("");
setCliente("");
setLugar("");
setMostrarFormulario(false);

};


/* =========================
   GUARDAR HORAS
========================= */

const guardarHoras = async(h)=>{

if(!trabajoActivo) return;

if(!trabajadorSeleccionado){
alert("Selecciona un trabajador");
return;
}

const hoy = fechaRegistro;
await addDoc(
collection(db,"trabajos",trabajoActivo.id,"registros"),
{
trabajador: trabajadorSeleccionado,
fecha: hoy,
horas: h,
precioHora: precioHora || 0
}
)

};


/* =========================
   BORRAR REGISTRO
========================= */

const borrarRegistro = async(id)=>{

if(!confirm("¿Borrar registro?")) return;

await deleteDoc(
doc(db,"trabajos",trabajoActivo.id,"registros",id)
);

};


/* =========================
   GUARDAR MATERIAL
========================= */
const guardarMaterial = async () => {

  if (!materialSeleccionado || !materialCantidad) return;

  const cantidad = Number(materialCantidad);

  const existente = materiales.find(
    m => m.material === materialSeleccionado
  );
const nuevoMaterial = {
material: materialSeleccionado,
cantidad: Number(materialCantidad),
precio: Number(materialPrecio),
fecha: new Date().toISOString().slice(0,10)
}
  if (existente) {

    await updateDoc(
      doc(db, "trabajos", trabajoActivo.id, "materiales", existente.id),
      {
        cantidad: existente.cantidad + cantidad
      }
    );

  } else {

  await addDoc(
collection(db, "trabajos", trabajoActivo.id, "materiales"),
{
material: materialSeleccionado,
cantidad: cantidad,
precio: Number(materialPrecio),
fecha: new Date().toISOString().slice(0,10)
}
)  

  }
setMaterialCantidad("")
setMaterialSeleccionado("")
setMaterialPrecio("")
  
};



/* =========================
   BORRAR MATERIAL
========================= */

const borrarMaterial = async(id)=>{

await deleteDoc(
doc(db,"trabajos",trabajoActivo.id,"materiales",id)
);

};

useEffect(() => {

  const cargarMateriales = async () => {

    const snapshot = await getDocs(collection(db, "materiales_catalogo"));

    const lista = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setMaterialesCatalogo(lista);
  };

  cargarMateriales();

}, []);
const finalizarTrabajo = async (id) => {

await updateDoc(
doc(db,"trabajos",id),
{
estado:"finalizado"
}
)

alert("Trabajo finalizado")

}
const reabrirTrabajo = async (id) => {

await updateDoc(
doc(db,"trabajos",id),
{
estado:"activo"
}
)

alert("Trabajo reabierto")

}
const borrarTrabajo = async (id) => {

const confirmar = window.confirm(
"¿Seguro que quieres borrar este trabajo?"
)

if(!confirmar) return

await deleteDoc(
doc(db,"trabajos",id)
)
}





/* =========================
   PANTALLA TRABAJO ABIERTO
========================= */

if (trabajoActivo) {

return (

<div>
<div className="trabajo-header">
<div className="titulo-trabajo">

<h2>{trabajoActivo.nombre}</h2>

<span className={`estado ${trabajoActivo.estado}`}>
{trabajoActivo.estado}
</span>

</div>


</div>


<div className="trabajo-panel">

<div className="panel-item">
<span>Cliente</span>
<strong>{trabajoActivo.cliente}</strong>
</div>

<div className="panel-item">
<span>Lugar</span>
<strong>{trabajoActivo.lugar}</strong>
</div>

<div className="panel-item">

<span>Precio hora</span>

<input
type="number"
placeholder="€/h"
value={precioHora}
onChange={(e)=>setPrecioHora(e.target.value)}
/>

</div>

</div>



{/* BOTONES SUPERIORES */}
<div className="tabs-trabajo">

<button
className={vistaTrabajo==="horas"?"active":""}
onClick={()=>setVistaTrabajo("horas")}
>
Horas
</button>

<button
className={vistaTrabajo==="materiales"?"active":""}
onClick={()=>setVistaTrabajo("materiales")}
>
Materiales
</button>

<button
className="pdf-btn"
onClick={()=>exportTrabajoPDF(
trabajoActivo,
registros,
materiales,
Number(precioHora || 0)
)}
>
PDF
</button>

</div>


{/* =========================
   VISTA HORAS
========================= */}

{vistaTrabajo==="horas" && (

<>

<div className="horas-form">

<div className="horas-linea">

<select
value={trabajadorSeleccionado}
onChange={(e)=>setTrabajadorSeleccionado(e.target.value)}
>
<option value="">Seleccionar trabajador</option>

{trabajadores.map(t => (
<option key={t.id} value={t.nombre}>
{t.nombre}
</option>
))}

</select>


<input
type="date"
value={fechaRegistro}
onChange={(e)=>setFechaRegistro(e.target.value)}
/>


<input
type="number"
step="0.5"
value={horasSeleccionadas}
onChange={(e)=>setHorasSeleccionadas(e.target.value)}
/>


<button
className="btn-primary"
onClick={()=>guardarHoras(Number(horasSeleccionadas))}
>
Registrar
</button>


<div className="horas-rapidas">

<button onClick={()=>guardarHoras(8)}>+8h</button>
<button onClick={()=>guardarHoras(7)}>+7h</button>
<button onClick={()=>guardarHoras(6)}>+6h</button>

</div>

</div>

</div>


<h3>Registros</h3>


{registros.map(r => (

<div key={r.id} className="registro-row">

<span>{r.fecha}</span>
<span>{r.trabajador}</span>
<span>{r.horas}h</span>

<button onClick={()=>borrarRegistro(r.id)}>
🗑
</button>

</div>

))}

</>

)}


{/* =========================
   VISTA MATERIALES
========================= */}

{vistaTrabajo==="materiales" && (

<>

<div className="material-header-line">

<h3>Materiales</h3>

<button
className="btn-primary"
onClick={guardarMaterial}
>
Añadir
</button>

</div>


{/* FORMULARIO MATERIAL */}

<div className="material-form">

<select
value={materialSeleccionado}
onChange={(e)=>{

const nombre = e.target.value

setMaterialSeleccionado(nombre)

const material = materialesCatalogo.find(
m => m.nombre === nombre
)

if(material){
setUnidadMaterial(material.unidad)
setMaterialPrecio(material.precio || "")
}

}}
>

<option value="">Seleccionar material</option>

{materialesCatalogo.map(m => (
<option key={m.id} value={m.nombre}>
{m.nombre}
</option>
))}

</select>


<div className="material-cantidad">

<input
type="number"
placeholder="Cantidad"
value={materialCantidad}
onChange={(e)=>setMaterialCantidad(e.target.value)}
/>

<span>{unidadMaterial}</span>

</div>


<input
type="number"
placeholder="Precio"
value={materialPrecio}
onChange={(e)=>setMaterialPrecio(e.target.value)}
/>

</div>


{/* CABECERA TABLA */}

<div className="material-header">

<span>Material</span>
<span>Cantidad</span>
<span>Precio</span>
<span>Total</span>
<span></span>

</div>


{/* LISTA MATERIALES */}

{materiales.map((m)=>{

const total = (m.cantidad || 0) * (m.precio || 0)

return(

<div key={m.id} className="material-row">

<span>{m.material}</span>
<span>{m.cantidad}</span>
<span>{m.precio || 0} €</span>
<span>{total} €</span>

<button onClick={()=>borrarMaterial(m.id)}>
🗑
</button>

</div>

)

})}


{/* TOTAL */}

<h3>

Total materiales: {

materiales.reduce(
(acc,m)=> acc + ((m.cantidad || 0) * (m.precio || 0)),
0
)

} €

</h3>

</>

)}


{/* VOLVER */}

<button onClick={()=>setTrabajoActivo(null)}>
← Volver
</button>


</div>

)

}


/* =========================
   LISTA DE TRABAJOS
========================= */

const trabajosActivos =
trabajos.filter(t => t.estado !== "finalizado")

const trabajosFinalizados =
trabajos.filter(t => t.estado === "finalizado")


return(

<div>

<div className="trabajos-header">

<h2>Trabajos</h2>

<button
className="primary-btn"
onClick={()=>setMostrarFormulario(true)}
>
+ Nuevo trabajo
</button>

</div>


{/* FORMULARIO NUEVO TRABAJO */}

{mostrarFormulario && (

<div style={{marginTop:"20px"}}>

<input
type="text"
placeholder="Nombre del trabajo"
value={nombreTrabajo}
onChange={(e)=>setNombreTrabajo(e.target.value)}
/>

<input
type="text"
placeholder="Cliente"
value={cliente}
onChange={(e)=>setCliente(e.target.value)}
/>

<input
type="text"
placeholder="Lugar"
value={lugar}
onChange={(e)=>setLugar(e.target.value)}
/>

<button onClick={crearTrabajo}>
Guardar trabajo
</button>

</div>

)}


{/* =========================
   TRABAJOS ACTIVOS
========================= */}

<h3>Trabajos activos</h3>

<div className="trabajos-list">

{trabajosActivos.map(t => (

<div key={t.id} className="trabajo-card">

<div className="trabajo-actions">

<button
onClick={(e)=>{
e.stopPropagation()
setTrabajoActivo(t)
}}
>
Abrir
</button>


<button
onClick={(e)=>{
e.stopPropagation()
finalizarTrabajo(t.id)
}}
>
Finalizar
</button>


<button
onClick={(e)=>{
e.stopPropagation()
borrarTrabajo(t.id)
}}
>
🗑
</button>

</div>


<h3 onClick={()=>setTrabajoActivo(t)}>
{t.nombre}
</h3>

<p>Cliente: {t.cliente}</p>
<p>Lugar: {t.lugar}</p>

</div>

))}

</div>


{/* =========================
   TRABAJOS FINALIZADOS
========================= */}

<h3 style={{marginTop:"40px"}}>
Trabajos finalizados
</h3>

<div className="trabajos-list">

{trabajosFinalizados.map(t => (

<div key={t.id} className="trabajo-card">

<div className="trabajo-actions">

<button
onClick={(e)=>{
e.stopPropagation()
setTrabajoActivo(t)
}}
>
Abrir
</button>


<button
onClick={(e)=>{
e.stopPropagation()
reabrirTrabajo(t.id)
}}
>
Reabrir
</button>

</div>


<h3 onClick={()=>setTrabajoActivo(t)}>
{t.nombre}
</h3>

<p>Cliente: {t.cliente}</p>
<p>Lugar: {t.lugar}</p>

</div>

))}

</div>

</div>

)

}

export default Trabajos