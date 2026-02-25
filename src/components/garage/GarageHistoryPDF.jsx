import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { formatInChileanTime } from '@/lib/utils';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: '', fontWeight: 'normal' },
    { src: '', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 8,
    color: '#666',
  },
  filterSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  filterText: {
    fontSize: 9,
    color: '#555',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
  },
  tableColHeader: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableCol: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  colLicense: { width: '15%' },
  colType: { width: '15%' },
  colEntry: { width: '18%' },
  colExit: { width: '18%' },
  colStatus: { width: '10%' },
  colOperator: { width: '14%' },
  colTotal: { width: '10%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: 'grey',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  totalLabelCol: {
    width: '90%',
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalValueCol: {
    width: '10%',
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 9,
  },
});

const GarageHistoryPDF = ({ data, totalRevenue, filters }) => {
  const hasFilters = filters.searchTerm || filters.entryDateFilter || filters.exitDateFilter || filters.statusFilter !== 'todos';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Historial de Movimientos - Garaje San José</Text>
            <Text style={styles.headerSubtitle}>Generado el: {formatInChileanTime(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          </View>
        </View>

        {hasFilters && (
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtros Aplicados:</Text>
            {filters.searchTerm && <Text style={styles.filterText}>- Búsqueda: "{filters.searchTerm}"</Text>}
            {filters.entryDateFilter && <Text style={styles.filterText}>- Fecha Ingreso: {filters.entryDateFilter}</Text>}
            {filters.exitDateFilter && <Text style={styles.filterText}>- Fecha Salida: {filters.exitDateFilter}</Text>}
            {filters.statusFilter !== 'todos' && <Text style={styles.filterText}>- Estado: {filters.statusFilter}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.colLicense]}>Matrícula</Text>
            <Text style={[styles.tableColHeader, styles.colType]}>Tipo</Text>
            <Text style={[styles.tableColHeader, styles.colEntry]}>Entrada</Text>
            <Text style={[styles.tableColHeader, styles.colExit]}>Salida</Text>
            <Text style={[styles.tableColHeader, styles.colStatus]}>Estado</Text>
            <Text style={[styles.tableColHeader, styles.colOperator]}>Operador</Text>
            <Text style={[styles.tableColHeader, styles.colTotal]}>Total</Text>
          </View>
          {data.map((stay) => (
            <View key={stay.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.colLicense]}>{stay.garage_vehicles?.license_plate}</Text>
              <Text style={[styles.tableCol, styles.colType]}>{stay.garage_vehicles?.vehicle_type}</Text>
              <Text style={[styles.tableCol, styles.colEntry]}>{formatInChileanTime(stay.entry_at, 'dd/MM/yy HH:mm')}</Text>
              <Text style={[styles.tableCol, styles.colExit]}>{stay.exit_at ? formatInChileanTime(stay.exit_at, 'dd/MM/yy HH:mm') : 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colStatus]}>{stay.status}</Text>
              <Text style={[styles.tableCol, styles.colOperator]}>{stay.profiles?.full_name || 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colTotal]}>${(stay.total_paid_clp || 0).toLocaleString('es-CL')}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelCol}>Total Ganancias (Finalizadas):</Text>
            <Text style={styles.totalValueCol}>${totalRevenue.toLocaleString('es-CL')}</Text>
          </View>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default GarageHistoryPDF;