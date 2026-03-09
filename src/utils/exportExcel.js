import * as XLSX from "xlsx";
import { formatearMes } from "./fechas";
export const exportarExcel = (registrosFiltrados, mesSeleccionado, precioHora) => {
  if (registrosFiltrados.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  const wb = XLSX.utils.book_new();

  const precio = precioHora;
  const mesTexto = formatearMes(mesSeleccionado);

  const data = [];

  // ===== CABECERA CORPORATIVA =====
  data.push([`CONTROL HIZ - ${mesTexto}`]);
  data.push([]);
  data.push(["Precio / hora (€)", precio]);
  data.push([]);

  // ===== ENCABEZADOS TABLA =====
  data.push(["Trabajador", "Fecha", "Lugar", "Horas", "Precio", "Total"]);

  // ===== FILAS =====
  registrosFiltrados.forEach((r, index) => {
    const filaExcel = 6 + index; // empieza en fila 6
    data.push([
      r.trabajador,
      r.fecha,
      r.lugar,
      Number(r.horas),
      precio,
      { f: `D${filaExcel}*E${filaExcel}` }
    ]);
  });

  const totalInicio = 6;
  const totalFin = totalInicio + registrosFiltrados.length - 1;

  data.push([]);
  data.push([
    "",
    "",
    "TOTAL HORAS",
    { f: `SUM(D${totalInicio}:D${totalFin})` }
  ]);

  data.push([
    "",
    "",
    "TOTAL €",
    "",
    "",
    { f: `SUM(F${totalInicio}:F${totalFin})` }
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Informe");

  XLSX.writeFile(wb, `Control_HIZ_${mesSeleccionado}.xlsx`);
};
 

  


