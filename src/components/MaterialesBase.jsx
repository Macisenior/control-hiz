import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

function MaterialesBase() {

const [materiales,setMateriales] = useState([]);
const [nuevoMaterial,setNuevoMaterial] = useState("");
const [unidad,setUnidad] = useState("");
const [precio,setPrecio] = useState("");


/* cargar materiales */

useEffect(()=>{

const cargarMateriales = async()=>{

const snapshot = await getDocs(collection(db,"materiales_catalogo"));

const lista = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

setMateriales(lista);
};

cargarMateriales();

},[]);



/* añadir material */

const añadirMaterial = async()=>{

if(!nuevoMaterial) return;

await addDoc(
collection(db,"materiales_catalogo"),
{
nombre:nuevoMaterial,
unidad:unidad,
precio:Number(precio)
}
);

setNuevoMaterial("");
setUnidad("");
setPrecio("");
const snapshot = await getDocs(collection(db,"materiales_catalogo"));

const lista = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

setMateriales(lista);

};



/* borrar material */

const borrarMaterial = async(id)=>{

await deleteDoc(
doc(db,"materiales_catalogo",id)
);

setMateriales(materiales.filter(m=>m.id!==id));

};



return(

<div>

<h2>Materiales</h2>


<div className="material-form">

<input
type="text"
placeholder="Material"
value={nuevoMaterial}
onChange={(e)=>setNuevoMaterial(e.target.value)}
/>

<input
type="text"
placeholder="Unidad (saco, m2, etc)"
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
<div className="material-header">
<span>Material</span>
<span>Unidad</span>
<span>Precio</span>
<span></span>
</div>
{materiales.map((m)=>(

<div key={m.id} className="material-row">

<span>{m.nombre}</span>
<span>{m.unidad}</span>
<span>{m.precio || 0} €</span>

<button onClick={()=>borrarMaterial(m.id)}>
🗑
</button>

</div>

))}






</div>

);

}

export default MaterialesBase;