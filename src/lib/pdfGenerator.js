import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate, calculateStayDuration } from '@/lib/parkingUtils';

export const generateHistoryPDF = (filteredHistory, settings, totalFeeForReport) => {
  const doc = new jsPDF();
  doc.text("Historial de Movimientos de Vehículos - San Jose Parking", 14, 16);
  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString(), true)}`, 14, 22);

  const tableColumn = ["Matrícula", "Tipo", "País", "Entrada", "Op. E.", "Salida", "Op. S.", "Estadía", `Tarifa (${settings.currencySymbol})`, "Estado"];
  const tableRows = [];

  filteredHistory.forEach(item => {
    let statusText = item.status === 'exited' ? 'Salió' : 'Estacionado';
    if (item.forcedExit) {
        statusText = 'Salida Forzada';
    }
    let exitText = item.exitTime ? formatDate(item.exitTime) : '---------------';

    const itemData = [
      item.plate,
      item.vehicleType || 'N/A',
      item.country || 'N/A',
      formatDate(item.entryTime),
      item.entryOperatorName || 'N/A',
      exitText,
      item.exitOperatorName || 'N/A',
      item.exitTime ? calculateStayDuration(item.entryTime, item.exitTime) : calculateStayDuration(item.entryTime),
      item.status === 'exited' ? (item.calculatedFee !== undefined ? item.calculatedFee.toFixed(2) : 'N/A') : 'N/A',
      statusText
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243] }, 
    styles: { fontSize: 6, cellPadding: 1 }, 
    columnStyles: {
      0: { cellWidth: 16 }, 
      1: { cellWidth: 16 }, 
      2: { cellWidth: 13 }, 
      3: { cellWidth: 20 }, 
      4: { cellWidth: 18 }, 
      5: { cellWidth: 20 }, 
      6: { cellWidth: 18 }, 
      7: { cellWidth: 13 }, 
      8: { cellWidth: 15, halign: 'right' }, 
      9: { cellWidth: 20 }, 
    },
    didParseCell: function (data) {
        const statusIndex = tableColumn.indexOf("Estado");
        if (data.column.index === statusIndex && data.cell.section === 'body') {
            if (data.cell.raw === 'Salida Forzada') {
                data.cell.styles.fillColor = [255, 235, 59]; 
                data.cell.styles.textColor = [0,0,0];
            } else if (data.cell.raw === 'Salió') {
                data.cell.styles.textColor = [220, 53, 69]; 
            } else if (data.cell.raw === 'Estacionado') {
                data.cell.styles.textColor = [40, 167, 69]; 
            }
        }
        
        const opEntryIndex = tableColumn.indexOf("Op. E.");
        const opExitIndex = tableColumn.indexOf("Op. S.");
        if ((data.column.index === opEntryIndex || data.column.index === opExitIndex) && data.cell.section === 'body') {
            if (typeof data.cell.raw === 'string' && data.cell.raw.length > 10) {
                data.cell.text = data.cell.raw.substring(0,9) + '...';
            }
        }
    },
    didDrawPage: function (data) {
      let pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text('Página ' + pageNumber, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  const finalY = doc.lastAutoTable.finalY || 30;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`Total de Tarifas (Reporte): ${settings.currencySymbol} ${totalFeeForReport.toFixed(2)}`, 14, finalY + 10);

  doc.save(`historial_vehiculos_sanjose_${new Date().toISOString().split('T')[0]}.pdf`);
};


export const generateOrderTicketPDF = (order, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 180] 
  });

  const restaurantName = settings.restaurantName || 'San Jose Restaurante';
  const currencySymbol = settings.currencySymbol || 'Bs.';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  let yPosition = margin;

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(restaurantName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Orden: ${order.displayId || order.id.substring(0,12)}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(`Fecha: ${formatDate(order.orderTime, true)}`, pageWidth / 2, yPosition, { align: 'center' }); // true for shortTime
  yPosition += 4;
  if (order.customerName && order.customerName !== 'Cliente General') {
    doc.text(`Cliente: ${order.customerName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
  }
  if (order.operatorName) {
    doc.text(`Atendido por: ${order.operatorName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
  }
  yPosition += 2; 
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;
  doc.setLineDashPattern([], 0);


  doc.setFontSize(8);
  const itemColumn = ["Cant.", "Ítem", "P. Unit.", "Subt."];
  const itemRows = [];
  order.items.forEach(item => {
    itemRows.push([
      item.quantity,
      item.name,
      `${currencySymbol} ${item.price.toFixed(2)}`,
      `${currencySymbol} ${(item.price * item.quantity).toFixed(2)}`
    ]);
  });

  doc.autoTable({
    head: [itemColumn],
    body: itemRows,
    startY: yPosition,
    theme: 'plain',
    styles: {
      fontSize: 7,
      cellPadding: { top: 0.5, right: 1, bottom: 0.5, left: 1 },
      halign: 'left',
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [230, 230, 230],
      textColor: [0,0,0],
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, 
      1: { cellWidth: 30 }, 
      2: { cellWidth: 15, halign: 'right' }, 
      3: { cellWidth: 15, halign: 'right' }, 
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - (margin * 2),
    didDrawPage: (data) => {
        yPosition = data.cursor.y;
    }
  });
  yPosition = doc.lastAutoTable.finalY + 2 || yPosition + 2;


  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;
  doc.setLineDashPattern([], 0);

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: ${currencySymbol} ${order.totalAmount.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 6;

  if (order.notes) {
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.text("Notas Adicionales:", margin, yPosition);
    yPosition += 3;
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(order.notes, pageWidth - (margin * 2));
    doc.text(notesLines, margin, yPosition);
    yPosition += (notesLines.length * 3) + 2;
  }
  
  doc.setFontSize(8);
  doc.text("¡Gracias por su preferencia!", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(restaurantName, pageWidth / 2, yPosition, { align: 'center' });

  doc.save(`ticket_pedido_${order.displayId || order.id.substring(0,8)}.pdf`);
};

export const generateOrdersHistoryPDF = (filteredOrders, settings) => {
  const doc = new jsPDF();
  doc.text("Historial de Pedidos - San Jose Restaurante", 14, 16);
  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${formatDate(new Date().toISOString(), true)}`, 14, 22);
  doc.text(`Total de pedidos en este reporte: ${filteredOrders.length}`, 14, 26);

  const tableColumn = ["ID Pedido", "Fecha y Hora", "Cliente", `Total (${settings.currencySymbol})`, "Estado", "Operador"];
  const tableRows = [];

  filteredOrders.forEach(order => {
    const orderData = [
      order.displayId || order.id.substring(0,12),
      formatDate(order.orderTime, true),
      order.customerName || 'N/A',
      order.totalAmount?.toFixed(2) || '0.00',
      order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Desconocido',
      order.operatorName || 'N/A'
    ];
    tableRows.push(orderData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [76, 175, 80] }, 
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 25 }, 
      1: { cellWidth: 35 }, 
      2: { cellWidth: 40 }, 
      3: { cellWidth: 20, halign: 'right' }, 
      4: { cellWidth: 25 }, 
      5: { cellWidth: 30 }  
    }
  });
  doc.save(`historial_pedidos_restaurante_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateEntryTicketPDF = (vehicleEntry, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 90] 
  });

  const parkingName = settings.parkingName || 'Garaje San José';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  let yPosition = margin;

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(parkingName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text("TICKET DE INGRESO", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Ticket ID: ${vehicleEntry.id.substring(vehicleEntry.id.length - 8).toUpperCase()}`, margin, yPosition);
  yPosition += 5;

  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;
  doc.setLineDashPattern([], 0);

  const field = (label, value) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, margin, yPosition);
    doc.setFont(undefined, 'normal');
    const valueWidth = doc.getTextWidth(value);
    const labelWidth = doc.getTextWidth(label + ": ");
    if (labelWidth + valueWidth > pageWidth - margin * 2) {
        const splitValue = doc.splitTextToSize(value, pageWidth - margin * 2 - labelWidth);
        doc.text(splitValue, margin + labelWidth, yPosition);
        yPosition += (splitValue.length * 4);
    } else {
        doc.text(value, margin + labelWidth, yPosition);
        yPosition += 4;
    }
  };

  field("Matrícula", vehicleEntry.plate);
  field("Tipo", vehicleEntry.vehicleType);
  field("País", vehicleEntry.country);
  field("Entrada", formatDate(vehicleEntry.entryTime, true)); // true for shortTime
  
  yPosition += 2;

  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.setLineDashPattern([], 0);
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text("¡Gracias por su preferencia!", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.setFontSize(7);
  doc.text(parkingName, pageWidth / 2, yPosition, { align: 'center' });

  doc.save(`ticket_entrada_${vehicleEntry.plate}_${formatDate(new Date().toISOString(), true).replace(/[\/:]/g, '-')}.pdf`);
};