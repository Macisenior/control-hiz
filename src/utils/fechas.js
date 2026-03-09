export const formatearMes = (mes) => {
  const fecha = new Date(mes + "-01");

  const texto = fecha.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
};