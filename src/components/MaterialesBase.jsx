import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
collection,
addDoc,
onSnapshot,
deleteDoc,
doc
} from "firebase/firestore";

function MaterialesBase(){

const [materialMenu,setMaterialMenu] = useState(null)
const [filaActiva,setFilaActiva] = useState(null)

const [materiales,setMateriales]=useState([]);
const [nuevoMaterial,setNuevoMaterial]=useState("");
const [unidad,setUnidad]=useState("");
const [precio,setPrecio]=useState("");

/* =========================
LONG PRESS
========================= */

const longPress = (id,callback)=>{

let timer

return{

onMouseDown:()=>{
setFilaActiva(id)
timer=setTimeout(callback,600)
},

onMouseUp:()=>{
clearTimeout(timer)
setFilaActiva(null)
},

onTouchStart:()=>{
setFilaActiva(id)
timer=setTimeout(callback,600)
},

onTouchEnd:()=>{
clearTimeout(timer)
setFilaActiva(null)
}

}

}

/* =========================
CARGAR MATERIALES
========================= */

useEffect(()=>{

const unsubscribe = onSnapshot(
collection(db,"materiales_catalogo"),
(snapshot)=>{

const lista = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

lista.sort((a,b)=>a.nombre.localeCompare(b.nombre));

setMateriales(lista);

});

return ()=>unsubscribe();

},[]);

/* =========================
AÑADIR MATERIAL
========================= */

const añadirMaterial = async()=>{

if(!nuevoMaterial || !unidad) return;

const existe = materiales.find(
m=>m.nombre.toLowerCase()===nuevoMaterial.toLowerCase()
);

if(existe){
alert("Ese material ya existe");
return;
}

await addDoc(
collection(db,"materiales_catalogo"),
{
nombre:nuevoMaterial,
unidad:unidad,
precio:Number(precio) || 0
}
);

setNuevoMaterial("");
setUnidad("");
setPrecio("");

};

/* =========================
BORRAR MATERIAL
========================= */

const borrarMaterial = async(id)=>{

await deleteDoc(
doc(db,"materiales_catalogo",id)
);

};

/* =========================
UI
========================= */

return(

<div className="pantalla-materiales">

<h2>Materiales</h2>

{/* FORMULARIO */}

<div className="materiales-base-form">

<input
type="text"
placeholder="Material"
value={nuevoMaterial}
onChange={(e)=>setNuevoMaterial(e.target.value)}
/>

<div className="materiales-base-linea">

<input
type="text"
placeholder="Unidad"
value={unidad}
onChange={(e)=>setUnidad(e.target.value)}
/>

<input
type="number"
placeholder="Precio"
value={precio}
onChange={(e)=>setPrecio(e.target.value)}
/>

<button onClick={añadirMaterial}>
Añadir
</button>

</div>

</div>

{/* LISTA */}

<div className="materiales-container">
<div className="materiales-header">

<span>Material</span>
<span>Unidad</span>
<span>Precio</span>

</div>
{materiales.map(m=>(

<div
key={m.id}
className={`material-row ${filaActiva===m.id?"registro-activo":""}`}
{...longPress(m.id,()=>{

setMaterialMenu(m)

})}
>

<span className="material-nombre">
{m.nombre}
</span>

<span className="material-unidad">
{m.unidad}
</span>

<span className="material-precio">
{m.precio} €
</span>

</div>

))}

</div>

{/* MODAL */}

{materialMenu && (

<div className="modal-confirm">

<div className="modal-box">

<p>
¿Eliminar <strong>{materialMenu.nombre}</strong>?
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

</div>

)

}

export default MaterialesBase;