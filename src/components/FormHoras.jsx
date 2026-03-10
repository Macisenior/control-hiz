function FormHoras({
  trabajador,
  setTrabajador,
  fecha,
  setFecha,
  lugar,
  setLugar,
  horas,
  setHoras,
  trabajadores,
  guardarHorasRapido,
  ultimoRegistro
}) {
  return (
  
  
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
  Repetir último
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
        
   
  );
}

export default FormHoras;