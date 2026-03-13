
import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";

import { db } from "../firebase";
function Trabajadores({
  trabajadores,
  nuevoTrabajador,
  setNuevoTrabajador,
  horasPorTrabajadorAnual,
setTrabajadores,
}) {

  return (
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
                onClick={async () => {
  const trabajador = trabajadores[index];

  const q = query(
  collection(db, "trabajadores"),
  where("nombre", "==", trabajador)
);

const snapshot = await getDocs(q);

for (const d of snapshot.docs) {
  await deleteDoc(doc(db, "trabajadores", d.id));
}
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
  );
}

export default Trabajadores;