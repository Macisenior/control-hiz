import { useState, useEffect } from "react"
import { db } from "../firebase"
import {
collection,
addDoc,
onSnapshot,
deleteDoc,
doc,
getDocs,
updateDoc
} from "firebase/firestore"

import { exportTrabajoPDF } from "../utils/exportTrabajoPDF"

function TrabajoDetalle({ trabajo, volver }) {

const [materialesCatalogo,setMaterialesCatalogo]=useState([])
const [trabajadores,setTrabajadores]=useState([])
const [trabajadorSeleccionado,setTrabajadorSeleccionado]=useState("")

const [registros,setRegistros]=useState([])
const [horas,setHoras]=useState("")
const [materialMenu,setMaterialMenu] = useState(null)
const [materiales,setMateriales]=useState([])
const [material,setMaterial]=useState("")
const [cantidad,setCantidad]=useState("")
const [precio,setPrecio]=useState("")
const [registroMenu,setRegistroMenu] = useState(null)
const [vista,setVista]=useState("horas")
const [precioHora,setPrecioHora]=useState("")
const [filaActiva,setFilaActiva]=useState(null)
const [fecha,setFecha]=useState(
new Date().toISOString().slice(0,10)
)
const longPress=(id,callback)=>{

let timer

return{

onTouchStart:()=>{
setFilaActiva(id)
timer=setTimeout(callback,600)
},

onTouchEnd:()=>{
clearTimeout(timer)
setFilaActiva(null)
},

onMouseDown:()=>{
setFilaActiva(id)
timer=setTimeout(callback,600)
},

onMouseUp:()=>{
clearTimeout(timer)
setFilaActiva(null)
}

}

}

/* =========================
CARGAR TRABAJADORES
========================= */

useEffect(()=>{

const cargar=async()=>{

const snap=await getDocs(collection(db,"trabajadores"))

const lista=snap.docs.map(d=>({
id:d.id,
...d.data()
}))

setTrabajadores(lista)

}

cargar()

},[])

/* =========================
CATALOGO MATERIALES
========================= */

useEffect(()=>{

const unsubscribe=onSnapshot(
collection(db,"materiales_catalogo"),
(snapshot)=>{

const lista=snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

setMaterialesCatalogo(lista)

})

return()=>unsubscribe()

},[])

/* =========================
REGISTROS HORAS
========================= */

useEffect(()=>{

const unsubscribe=onSnapshot(
collection(db,"trabajos",trabajo.id,"registros"),
(snapshot)=>{

const lista=snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

setRegistros(lista)

})

return()=>unsubscribe()

},[trabajo])

/* =========================
MATERIALES TRABAJO
========================= */

useEffect(()=>{

const unsubscribe=onSnapshot(
collection(db,"trabajos",trabajo.id,"materiales"),
(snapshot)=>{

const lista=snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

setMateriales(lista)

})

return()=>unsubscribe()

},[trabajo])

/* =========================
GUARDAR HORAS
========================= */

const guardarHoras=async()=>{

if(!trabajadorSeleccionado || !horas)return

await addDoc(
collection(db,"trabajos",trabajo.id,"registros"),
{
trabajador:trabajadorSeleccionado,
fecha:fecha,
horas:Number(horas),
precioHora:Number(precioHora)||0
}
)

setHoras("")

}

/* =========================
BORRAR REGISTRO
========================= */

const borrarRegistro=async(id)=>{

await deleteDoc(
doc(db,"trabajos",trabajo.id,"registros",id)
)

}

/* =========================
GUARDAR MATERIAL
========================= */

const guardarMaterial = async()=>{

if(!material || !cantidad) return

const cantidadNum = Number(cantidad)

const existente = materiales.find(
m => m.material === material
)

if(existente){

await updateDoc(
doc(db,"trabajos",trabajo.id,"materiales",existente.id),
{
cantidad: existente.cantidad + cantidadNum
}
)

}else{

await addDoc(
collection(db,"trabajos",trabajo.id,"materiales"),
{
material: material,
cantidad: cantidadNum,
precio: Number(precio)
}
)

}

setMaterial("")
setCantidad("")
setPrecio("")

}

/* =========================
BORRAR MATERIAL
========================= */

const borrarMaterial=async(id)=>{

await deleteDoc(
doc(db,"trabajos",trabajo.id,"materiales",id)
)

}

/* =========================
TOTALES
========================= */

const totalHoras=registros.reduce(
(acc,r)=>acc+(Number(r.horas)||0),0
)

const totalEuros=registros.reduce(
(acc,r)=>acc+(Number(r.horas||0)*Number(r.precioHora||0)),0
)

const totalMateriales=materiales.reduce(
(acc,m)=>acc+(Number(m.cantidad||0)*Number(m.precio||0)),0
)

const totalTrabajo=totalEuros+totalMateriales

return(

<div className="pantalla-trabajo">

<div className="trabajo-header">

<h2>{trabajo.nombre}</h2>

<button
className="btn-volver"
onClick={volver}
>
← Volver
</button>

</div>

<div className="tabs-trabajo">

<button
className={vista==="horas"?"active":""}
onClick={()=>setVista("horas")}
>
Horas
</button>

<button
className={vista==="materiales"?"active":""}
onClick={()=>setVista("materiales")}
>
Materiales
</button>

<button
className="pdf-btn"
onClick={()=>exportTrabajoPDF(
trabajo,
registros,
materiales,
Number(precioHora||0)
)}
>
PDF
</button>

</div>

{/* =========================
HORAS
========================= */}

{vista==="horas" && (

<div>

<h3>Registrar horas</h3>

<div className="horas-form">

<div className="horas-linea">

<select
value={trabajadorSeleccionado}
onChange={(e)=>setTrabajadorSeleccionado(e.target.value)}
>
<option value="">Trabajador</option>

{trabajadores.map(t=>(
<option key={t.id} value={t.nombre}>
{t.nombre}
</option>
))}

</select>

<input
type="date"
value={fecha}
onChange={(e)=>setFecha(e.target.value)}
/>

</div>


<div className="horas-linea">

<input
type="number"
placeholder="Horas"
value={horas}
onChange={(e)=>setHoras(e.target.value)}
/>

<input
type="number"
placeholder="€/hora"
value={precioHora}
onChange={(e)=>setPrecioHora(e.target.value)}
/>

<button
className="btn-registrar"
onClick={guardarHoras}
>
Registrar
</button>

</div>

</div>

<h3>Registros</h3>

<div className="registros-container">
{registroMenu && (

<div className="modal-confirm">

<div className="modal-box">

<p>
¿Eliminar registro de <strong>{registroMenu.trabajador}</strong>?
</p>

<div className="modal-botones">

<button
className="btn-eliminar"
onClick={()=>{
borrarRegistro(registroMenu.id)
setRegistroMenu(null)
}}
>
Eliminar
</button>

<button
onClick={()=>setRegistroMenu(null)}
>
Cancelar
</button>

</div>

</div>

</div>

)}

{registros.map(r=>{

const total=(Number(r.horas)||0)*(Number(r.precioHora)||0)

return(

<div
key={r.id}
className={`registro-row ${filaActiva===r.id?"registro-activo":""}`}
{...longPress(r.id,()=>{

setRegistroMenu(r)

})}
>
  
<span className="registro-nombre">
{r.trabajador}
</span>

<span className="registro-fecha">
{r.fecha}
</span>

<span className="registro-horas">
{r.horas} h
</span>

<span className="registro-total">
{total.toFixed(2)} €
</span>

</div>


)

})}

</div>

<div><strong>Total horas:</strong> {totalHoras} h</div>
<div><strong>Total mano de obra:</strong> {totalEuros.toFixed(2)} €</div>

</div>

)}

{/* =========================
MATERIALES
========================= */}

{vista==="materiales" && (

<div>

<h3>Añadir material</h3>

<div className="material-form">

<select
value={material}
onChange={(e)=>{

const nombre=e.target.value
setMaterial(nombre)

const mat=materialesCatalogo.find(
m=>m.nombre===nombre
)

if(mat){
setPrecio(mat.precio||"")
}

}}
>
<option value="">Material</option>

{materialesCatalogo.map(m=>(
<option key={m.id} value={m.nombre}>
{m.nombre}
</option>
))}

</select>


<div className="material-linea">

<input
type="number"
placeholder="Cantidad"
value={cantidad}
onChange={(e)=>setCantidad(e.target.value)}
/>

<input
type="number"
placeholder="€/unidad"
value={precio}
onChange={(e)=>setPrecio(e.target.value)}
/>

<button
className="btn-material"
onClick={guardarMaterial}
>
Añadir
</button>

</div>

</div>

<h3>Materiales</h3>


<div className="materiales-container">
{materiales.map(m=>{

const total=(Number(m.cantidad)||0)*(Number(m.precio)||0)

return(

<div
key={m.id}
className={`material-row ${filaActiva===m.id?"registro-activo":""}`}
{...longPress(m.id,()=>{

setMaterialMenu(m)

})}
>

<span className="material-nombre">
{m.material}
</span>

<span className="material-cantidad">
{m.cantidad} u
</span>

<span className="material-precio">
{m.precio} €/u
</span>

<span className="material-total">
{total.toFixed(2)} €
</span>

</div>

)

})}

</div>
{materialMenu && (

<div className="modal-confirm">

<div className="modal-box">

<p>
¿Eliminar material <strong>{materialMenu.material}</strong>?
</p>

<div className="modal-botones">

<button
className="btn-eliminar"
onClick={()=>{
borrarMaterial(materialMenu.id)
setMaterialMenu(null)
}}
>
Eliminar
</button>

<button
onClick={()=>setMaterialMenu(null)}
>
Cancelar
</button>

</div>

</div>

</div>

)}
<div>
<strong>Total materiales:</strong> {totalMateriales.toFixed(2)} €
</div>

</div>

)}

{/* =========================
RESUMEN TRABAJO
========================= */}

<div style={{marginTop:"25px"}}>

<h3>Resumen del trabajo</h3>

<div><strong>Mano de obra:</strong> {totalEuros.toFixed(2)} €</div>
<div><strong>Materiales:</strong> {totalMateriales.toFixed(2)} €</div>

<div style={{fontSize:"18px",marginTop:"6px"}}>
<strong>Total trabajo:</strong> {totalTrabajo.toFixed(2)} €
</div>

</div>

</div>

)

}

export default TrabajoDetalle