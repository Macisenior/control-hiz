import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import TrabajoDetalle from "./TrabajoDetalle";

function Trabajos({ user }) {

const [mostrarFormulario,setMostrarFormulario]=useState(false)

const [nombreTrabajo,setNombreTrabajo]=useState("")
const [cliente,setCliente]=useState("")
const [lugar,setLugar]=useState("")
const [registroMenu,setRegistroMenu] = useState(null)
const [trabajos,setTrabajos]=useState([])
const [trabajoActivo,setTrabajoActivo]=useState(null)

useEffect(()=>{

if(!user)return

const unsubscribe=onSnapshot(
collection(db,"trabajos"),
(snapshot)=>{

const lista=snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

setTrabajos(lista)

}
)

return()=>unsubscribe()

},[user])

const crearTrabajo=async()=>{

if(!nombreTrabajo || !cliente || !lugar){
alert("Completa todos los campos")
return
}

await addDoc(collection(db,"trabajos"),{
nombre:nombreTrabajo,
cliente:cliente,
lugar:lugar,
estado:"activo",
creado:new Date()
})

setNombreTrabajo("")
setCliente("")
setLugar("")
setMostrarFormulario(false)

}

const finalizarTrabajo=async(id)=>{

await updateDoc(
doc(db,"trabajos",id),
{estado:"finalizado"}
)

}

const reabrirTrabajo=async(id)=>{

await updateDoc(
doc(db,"trabajos",id),
{estado:"activo"}
)

}

const borrarTrabajo=async(id)=>{

const confirmar = window.confirm(
"¿Seguro que quieres borrar este trabajo?"
)

if(!confirmar) return

await deleteDoc(
doc(db,"trabajos",id)
)

}

if(trabajoActivo){

return(

<TrabajoDetalle
trabajo={trabajoActivo}
volver={()=>setTrabajoActivo(null)}
/>

)

}

const trabajosActivos=trabajos.filter(t=>t.estado!=="finalizado")
const trabajosFinalizados=trabajos.filter(t=>t.estado==="finalizado")

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

{mostrarFormulario && (

<div>

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

<h3>Trabajos activos</h3>

<div className="trabajo-actions">

{trabajosActivos.map(t=>(

<div key={t.id} className="trabajo-card">

<div className="trabajo-actions">

<button onClick={()=>setTrabajoActivo(t)}>
Abrir
</button>

<button onClick={()=>finalizarTrabajo(t.id)}>
Finalizar
</button>

<button onClick={()=>borrarTrabajo(t.id)}>
🗑
</button>

</div>

<h3>{t.nombre}</h3>
<p>{t.cliente}</p>

</div>

))}


</div>

<h3 style={{marginTop:"40px"}}>
Trabajos finalizados
</h3>

<div className="trabajos-list">

{trabajosFinalizados.map(t=>(

<div key={t.id} className="trabajo-card">

<button onClick={()=>setTrabajoActivo(t)}>
Abrir
</button>

<button onClick={()=>reabrirTrabajo(t.id)}>
Reabrir
</button>

<h3>{t.nombre}</h3>
<p>{t.cliente}</p>

</div>

))}

</div>

</div>

)

}

export default Trabajos