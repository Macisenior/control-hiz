import { db } from "../firebase";
import { collection, addDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";

export const crearRegistro = async (nuevoRegistro) => {
  await addDoc(collection(db, "registros"), nuevoRegistro);
};

export const eliminarRegistro = async (id) => {
  await deleteDoc(doc(db, "registros", id));
};
export const escucharRegistros = (callback) => {

  const ref = collection(db, "registros");

  return onSnapshot(
    ref,
    (snapshot) => {

      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(datos);
    },
    (error) => {
      console.warn("Firestore listener:", error.message);
    }
  );
};