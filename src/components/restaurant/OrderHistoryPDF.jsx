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
  colCode: { width: '15%' },
  colCustomer: { width: '15%' },
  colDate: { width: '18%' },
  colCategory: { width: '15%' },
  colStatus: { width: '12%' },
  colOperator: { width: '15%' },
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

const OrderHistoryPDF = ({ data, totalAmount, filters }) => {
  const hasFilters = filters.searchTerm || filters.dateFilter || filters.categoryFilter !== 'todos';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Historial de Pedidos - Restaurante San José</Text>
            <Text style={styles.headerSubtitle}>Generado el: {formatInChileanTime(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          </View>
        </View>

        {hasFilters && (
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filtros Aplicados:</Text>
            {filters.searchTerm && <Text style={styles.filterText}>- Búsqueda: "{filters.searchTerm}"</Text>}
            {filters.dateFilter && <Text style={styles.filterText}>- Fecha: {filters.dateFilter}</Text>}
            {filters.categoryFilter !== 'todos' && <Text style={styles.filterText}>- Categoría: {filters.categoryFilter}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.colCode]}>Código</Text>
            <Text style={[styles.tableColHeader, styles.colCustomer]}>Cliente</Text>
            <Text style={[styles.tableColHeader, styles.colDate]}>Fecha</Text>
            <Text style={[styles.tableColHeader, styles.colCategory]}>Categoría</Text>
            <Text style={[styles.tableColHeader, styles.colStatus]}>Estado</Text>
            <Text style={[styles.tableColHeader, styles.colOperator]}>Operador</Text>
            <Text style={[styles.tableColHeader, styles.colTotal]}>Total</Text>
          </View>
          {data.map((order) => (
            <View key={order.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.colCode]}>{order.order_code || 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colCustomer]}>{order.customer_name || 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colDate]}>{formatInChileanTime(order.created_at, 'dd/MM/yy HH:mm')}</Text>
              <Text style={[styles.tableCol, styles.colCategory]}>{order.restaurant_order_items[0]?.restaurant_menu_items.restaurant_categories.name || 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colStatus]}>{order.status}</Text>
              <Text style={[styles.tableCol, styles.colOperator]}>{order.profiles?.full_name || 'N/A'}</Text>
              <Text style={[styles.tableCol, styles.colTotal]}>${(order.total_amount_clp || 0).toLocaleString('es-CL')}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelCol}>Total Ganancias (Completados):</Text>
            <Text style={styles.totalValueCol}>${totalAmount.toLocaleString('es-CL')}</Text>
          </View>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default OrderHistoryPDF;