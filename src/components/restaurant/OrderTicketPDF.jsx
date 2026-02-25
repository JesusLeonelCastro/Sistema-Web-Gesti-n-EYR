import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Svg, Path } from '@react-pdf/renderer';
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
    padding: 10,
    width: '80mm',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  subtitle: {
    fontSize: 8,
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 8,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    color: '#6B7280',
  },
  value: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    marginBottom: 4,
  },
  thQty: { width: '15%', fontSize: 8, fontWeight: 'bold', color: '#6B7280' },
  thProduct: { width: '60%', fontSize: 8, fontWeight: 'bold', color: '#6B7280' },
  thSubtotal: { width: '25%', fontSize: 8, fontWeight: 'bold', color: '#6B7280', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tdQty: { width: '15%', fontSize: 9 },
  tdProduct: { width: '60%', fontSize: 9 },
  tdSubtotal: { width: '25%', fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
  totalSection: {
    marginTop: 10,
    paddingTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  notesSection: {
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
    color: '#6B7280',
  },
  notesText: {
    fontSize: 9,
    color: '#374151',
  },
  footer: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 8,
    color: '#6B7280',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBold: {
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  barcodeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});

const Barcode = ({ code }) => {
  const code39 = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '$': '100100100101',
    '/': '100100101001', '+': '100101001001', '%': '101001001001', '*': '100101101101'
  };
  
  const safeCode = (code || '').replace(/[^A-Z0-9-]/g, '');
  if (!safeCode) return null;

  const fullCode = `*${safeCode}*`;
  let binaryCode = '';
  for (let i = 0; i < fullCode.length; i++) {
    if (code39[fullCode[i]]) {
      binaryCode += code39[fullCode[i]] + '0';
    }
  }

  let x = 0;
  const paths = [];
  for (let i = 0; i < binaryCode.length; i++) {
    const bar = binaryCode[i];
    const width = bar === '1' ? 2 : 1;
    if (i % 2 === 0) {
      paths.push(<Path key={i} d={`M ${x} 0 L ${x} 40 L ${x + width} 40 L ${x + width} 0 Z`} />);
    }
    x += width;
  }

  return (
    <Svg width={x} height="40" viewBox={`0 0 ${x} 40`}>
      {paths}
    </Svg>
  );
};

const OrderTicketPDF = ({ order }) => {
  if (!order) return null;

  const total = order.items.reduce((acc, item) => acc + item.price_clp * item.quantity, 0);
  const barcodeValue = order.order_code ? order.order_code.replace(/-/g, '') : '';

  return (
    <Document>
      <Page size={{ width: 226.77, height: 'auto' }} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Restaurante San José</Text>
          <Text style={styles.subtitle}>Comprobante de Pedido</Text>
        </View>

        <View style={styles.line} />

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Pedido No:</Text>
            <Text style={styles.value}>{order.order_code || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{formatInChileanTime(order.created_at, 'dd/MM/yyyy HH:mm')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{order.customer_name || '------------'}</Text>
          </View>
          
        </View>
        
        <View style={styles.line} />

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.thQty}>CANT</Text>
            <Text style={styles.thProduct}>PRODUCTO</Text>
            <Text style={styles.thSubtotal}>SUBTOTAL</Text>
          </View>
          
          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tdQty}>{item.quantity}x</Text>
              <Text style={styles.tdProduct}>{item.name}</Text>
              <Text style={styles.tdSubtotal}>${(item.price_clp * item.quantity).toLocaleString('es-CL')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>${total.toLocaleString('es-CL')}</Text>
          </View>
        </View>

        {order.description && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notas Adicionales:</Text>
            <Text style={styles.notesText}>{order.description}</Text>
          </View>
        )}

        <View style={styles.barcodeContainer}>
          <Barcode code={barcodeValue} />
          <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>{barcodeValue}</Text>
        </View>

        <View style={styles.footer}>
          <Text>¡MUCHAS GRACIAS POR SU VISITA!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OrderTicketPDF;