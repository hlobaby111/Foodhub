// CSV Export Utility

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      
      // Handle nested objects
      if (value && typeof value === 'object') {
        if (value.name) value = value.name;
        else if (value._id) value = value._id;
        else value = JSON.stringify(value);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) value = '';
      
      // Escape commas and quotes
      value = String(value).replace(/"/g, '""');
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`;
      }
      
      return value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Format data for specific exports
export const formatOrdersForExport = (orders) => {
  return orders.map(order => ({
    'Order ID': order._id,
    'Order Number': order.orderNumber,
    'Customer': order.customer?.name || '',
    'Customer Phone': order.customer?.phone || '',
    'Restaurant': order.restaurant?.name || '',
    'Status': order.orderStatus,
    'Payment Status': order.paymentStatus,
    'Payment Method': order.paymentMethod,
    'Total Amount': order.totalAmount,
    'Delivery Address': order.deliveryAddress?.street || '',
    'Created At': new Date(order.createdAt).toLocaleString(),
    'Delivered At': order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''
  }));
};

export const formatRestaurantsForExport = (restaurants) => {
  return restaurants.map(r => ({
    'Restaurant ID': r._id,
    'Name': r.name,
    'Owner': r.owner?.name || '',
    'Phone': r.phone || r.owner?.phone || '',
    'Email': r.email || r.owner?.email || '',
    'Status': r.status,
    'Is Active': r.isActive ? 'Yes' : 'No',
    'Commission %': r.commissionPercent || 18,
    'Total Orders': r.totalOrders || 0,
    'Total Earnings': r.totalEarnings || 0,
    'City': r.address?.city || r.location || '',
    'Created At': new Date(r.createdAt).toLocaleString()
  }));
};

export const formatCustomersForExport = (customers) => {
  return customers.map(c => ({
    'Customer ID': c._id,
    'Name': c.name || '',
    'Phone': c.phone || '',
    'Email': c.email || '',
    'Status': c.isActive ? 'Active' : 'Blocked',
    'Role': c.role,
    'Joined At': new Date(c.createdAt).toLocaleString()
  }));
};

export const formatPayoutsForExport = (payouts) => {
  return payouts.map(p => ({
    'Payout ID': p._id,
    'Payee Type': p.payeeType,
    'Payee Name': p.restaurant?.name || p.deliveryPartner?.name || '',
    'Period Start': new Date(p.periodStart).toLocaleDateString(),
    'Period End': new Date(p.periodEnd).toLocaleDateString(),
    'Gross Amount': p.grossAmount,
    'Commission': p.commission,
    'Net Amount': p.netAmount,
    'Status': p.status,
    'Paid At': p.paidAt ? new Date(p.paidAt).toLocaleString() : ''
  }));
};
