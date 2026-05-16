import { useState, useEffect } from "react"
import { db } from "../firebase"

import {
collection,
addDoc,
onSnapshot,
deleteDoc,
doc,
updateDoc
} from "firebase/firestore"

function ExtrasTrabajo({ trabajo }) {

const [extras,setExtras]=useState([])
const [concepto,setConcepto]=useState("")
const [importe,setImporte]=useState("")
const [editando,setEditando]=useState(null)

/* =========================
CARGAR EXTRAS
========================= */

useEffect(()=>{

const unsubscribe=onSnapshot(
collection(db,"trabajos",trabajo.id,"extras"),
(snapshot)=>{

const lista=snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

setExtras(lista)

})

return()=>unsubscribe()

},[trabajo])

/* =========================
GUARDAR
========================= */

const guardarExtra=async()=>{

if(!concepto) return

await addDoc(
collection(db,"trabajos",trabajo.id,"extras"),
{
concepto,
importe:Number(importe)||0
}
)

setConcepto("")
setImporte("")

}

/* =========================
ACTUALIZAR
========================= */

const actualizarExtra=async()=>{

if(!editando) return

await updateDoc(
doc(db,"trabajos",trabajo.id,"extras",editando.id),
{
concepto,
importe:Number(importe)||0
}
)

setEditando(null)
setConcepto("")
setImporte("")

}

/* =========================
BORRAR
========================= */

const borrarExtra=async(id)=>{

await deleteDoc(
doc(db,"trabajos",trabajo.id,"extras",id)
)

}

/* =========================
TOTAL
========================= */

const totalExtras=extras.reduce(
(acc,e)=>acc+(Number(e.importe)||0),0
)

return(

<div>

<h3>Añadir extra</h3>

<div className="material-form">

<input
type="text"
placeholder="Concepto"
value={concepto}
onChange={(e)=>setConcepto(e.target.value)}
/>

<div className="material-linea">

<input
type="number"
placeholder="Importe €"
value={importe}
onChange={(e)=>setImporte(e.target.value)}
/>

<button
className="btn-material"
onClick={()=>{
if(editando){
actualizarExtra()
}else{
guardarExtra()
}
}}
>
{editando ? "Guardar" : "Añadir"}
</button>

</div>

</div>

<h3>Extras</h3>

<div className="materiales-container">

{extras.map(e=>(

<div
key={e.id}
className="material-row"
>

<span className="material-nombre">
{e.concepto}
</span>

<span className="material-total">
{Number(e.importe).toFixed(2)} €
</span>

<div
style={{
display:"flex",
gap:"6px"
}}
>

<button
onClick={()=>{

setEditando(e)
setConcepto(e.concepto)
setImporte(e.importe || "")

}}
>
Editar
</button>

<button
onClick={()=>borrarExtra(e.id)}
>
X
</button>

</div>

</div>

))}

</div>

<div>
<strong>Total extras:</strong> {totalExtras.toFixed(2)} €
</div>

</div>

)

}

export default ExtrasTrabajo